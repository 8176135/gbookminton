import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user, balanceTransaction } from '$lib/server/db/schema';
import { and, desc, eq, sql, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	// Get user details
	const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

	const now = new Date();

	// Get invited plus-ones
	let invitedPlusOnes: any[] = [];
	if (currentUser.accountType === 'company' || currentUser.role === 'admin') {
		invitedPlusOnes = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				balance: user.balance
			})
			.from(user)
			.where(eq(user.invitedById, currentUser.id));
	}

	// Get all unlocked events for processing
	const allEvents = await db
		.select()
		.from(event)
		.where(eq(event.isLocked, false))
		.orderBy(event.date);

	// Categorize events by time
	const currentEvents: typeof allEvents = [];
	const upcomingEvents: typeof allEvents = [];
	const pastEvents: typeof allEvents = [];

	for (const ev of allEvents) {
		const startTime = new Date(ev.date);
		const endTime = new Date(startTime.getTime() + ev.duration * 60 * 1000);

		if (now >= startTime && now <= endTime) {
			currentEvents.push(ev);
		} else if (now < startTime) {
			upcomingEvents.push(ev);
		} else {
			pastEvents.push(ev);
		}
	}

	// Get signed up events for this user
	const userSignups = await db
		.select()
		.from(eventSignup)
		.where(eq(eventSignup.userId, session.user.id));

	// Create a map to easily check user's status for each event
	const signupStatusMap: Record<string, string> = {};
	for (const signup of userSignups) {
		signupStatusMap[signup.eventId] = signup.status;
	}

	// Get signed up events for invited plus-ones
	const plusOneSignupMap: Record<string, Record<string, string>> = {};
	if (invitedPlusOnes.length > 0) {
		const plusOneSignups = await db
			.select()
			.from(eventSignup)
			.where(
				inArray(
					eventSignup.userId,
					invitedPlusOnes.map((p) => p.id)
				)
			);

		for (const signup of plusOneSignups) {
			if (!plusOneSignupMap[signup.eventId]) {
				plusOneSignupMap[signup.eventId] = {};
			}
			plusOneSignupMap[signup.eventId][signup.userId] = signup.status;
		}
	}

	// Also get the current total enrolled players per event
	const query = db
		.select({
			eventId: eventSignup.eventId,
			count: sql<number>`count(${eventSignup.id})`
		})
		.from(eventSignup)
		.where(sql`${eventSignup.status} IN ('listed', 'locked')`) // waitlist doesn't count towards capacity
		.groupBy(eventSignup.eventId);

	const enrollmentCounts = await query;
	const enrollmentCountMap: Record<string, number> = {};
	for (const count of enrollmentCounts) {
		enrollmentCountMap[count.eventId] = count.count;
	}

	// Get names of all enrolled users
	const enrolledUsersData = await db
		.select({
			eventId: eventSignup.eventId,
			userName: user.name,
			status: eventSignup.status
		})
		.from(eventSignup)
		.innerJoin(user, eq(eventSignup.userId, user.id))
		.where(sql`${eventSignup.status} IN ('listed', 'locked')`);

	const enrolledUsersMap: Record<string, { name: string; status: string }[]> = {};
	const canViewAttendeesMap: Record<string, boolean> = {};

	for (const ev of allEvents) {
		const canSee =
			session.user.role === 'admin' ||
			ev.visibility === 'public' ||
			(ev.visibility === 'onlyCompany' && currentUser.accountType === 'company');
		canViewAttendeesMap[ev.id] = canSee;

		if (canSee) {
			enrolledUsersMap[ev.id] = enrolledUsersData
				.filter((s) => s.eventId === ev.id)
				.map((s) => ({ name: s.userName, status: s.status }));
		}
	}

	return {
		user: currentUser,
		currentEvents,
		upcomingEvents,
		pastEvents,
		isAdmin: session.user.role === 'admin',
		signupStatusMap,
		enrollmentCountMap,
		enrolledUsersMap,
		canViewAttendeesMap,
		invitedPlusOnes,
		plusOneSignupMap
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	signup: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) throw redirect(302, '/login');

		const data = await request.formData();
		const eventId = data.get('eventId') as string;
		const targetUserId = data.get('targetUserId') as string;

		const [ev] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
		if (!ev) return { error: 'Event not found' };

		if (new Date(ev.deadline).getTime() < Date.now()) {
			return { error: 'Registration deadline has passed' };
		}

		const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

		const isSponsored = targetUserId && targetUserId !== session.user.id;
		let targetUser = currentUser;

		if (isSponsored) {
			const [invitedGuest] = await db
				.select()
				.from(user)
				.where(and(eq(user.id, targetUserId), eq(user.invitedById, session.user.id)))
				.limit(1);

			if (!invitedGuest) {
				return { error: 'Invalid guest user' };
			}
			targetUser = invitedGuest;
		}

		const [existing] = await db
			.select()
			.from(eventSignup)
			.where(and(eq(eventSignup.userId, targetUser.id), eq(eventSignup.eventId, eventId)))
			.limit(1);
		if (existing && existing.status !== 'withdrawn' && existing.status !== 'removed') {
			return {
				error: isSponsored ? `${targetUser.name} is already signed up` : 'Already signed up'
			};
		}

		const [{ count }] = await db
			.select({ count: sql<number>`count(${eventSignup.id})` })
			.from(eventSignup)
			.where(
				and(eq(eventSignup.eventId, eventId), sql`${eventSignup.status} IN ('listed', 'locked')`)
			);

		const status = count < ev.capacity ? 'listed' : 'waitlist';
		const shouldCharge = status === 'listed';

		const cost = isSponsored
			? ev.costPlusOne
			: currentUser.accountType === 'company'
				? ev.costCompany
				: ev.costPlusOne;

		if (shouldCharge && cost > 0 && currentUser.balance < cost) {
			return {
				error: isSponsored
					? `Insufficient funds in your account to secure a spot for ${targetUser.name}`
					: 'Insufficient funds to secure a spot for this event'
			};
		}

		let signupId: string;
		if (existing) {
			signupId = existing.id;
			await db
				.update(eventSignup)
				.set({ status, paidById: isSponsored ? currentUser.id : null, createdAt: new Date() })
				.where(eq(eventSignup.id, existing.id));
		} else {
			signupId = crypto.randomUUID();
			await db.insert(eventSignup).values({
				id: signupId,
				userId: targetUser.id,
				eventId,
				status,
				paidById: isSponsored ? currentUser.id : null,
				createdAt: new Date()
			});
		}

		if (shouldCharge && cost > 0) {
			await db
				.update(user)
				.set({ balance: currentUser.balance - cost, updatedAt: new Date() })
				.where(eq(user.id, currentUser.id));

			await db.insert(balanceTransaction).values({
				id: crypto.randomUUID(),
				userId: currentUser.id,
				amount: -cost,
				reference: eventId,
				eventSignupId: signupId,
				type: 'signup_deduction',
				notes: isSponsored
					? `Event signup (Sponsored: ${targetUser.name}): ${ev.title}`
					: `Event signup: ${ev.title}`,
				date: new Date()
			});
		}

		return { success: true };
	},

	withdraw: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) throw redirect(302, '/login');

		const data = await request.formData();
		const eventId = data.get('eventId') as string;
		const targetUserId = data.get('targetUserId') as string;

		const [ev] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
		if (!ev) return { error: 'Event not found' };

		if (new Date(ev.deadline).getTime() < Date.now()) {
			return { error: 'Registration deadline has passed, cannot withdraw' };
		}

		const playerId =
			targetUserId && targetUserId !== session.user.id ? targetUserId : session.user.id;

		if (playerId !== session.user.id) {
			const [invitedGuest] = await db
				.select()
				.from(user)
				.where(and(eq(user.id, playerId), eq(user.invitedById, session.user.id)))
				.limit(1);
			if (!invitedGuest) {
				return { error: 'Invalid guest user' };
			}
		}

		const [signup] = await db
			.select()
			.from(eventSignup)
			.where(and(eq(eventSignup.userId, playerId), eq(eventSignup.eventId, eventId)))
			.limit(1);
		if (
			!signup ||
			signup.status === 'withdrawn' ||
			signup.status === 'removed' ||
			signup.status === 'locked'
		) {
			return { error: 'Cannot withdraw' };
		}

		const wasListed = signup.status === 'listed';
		const payerId = signup.paidById ?? signup.userId;

		let playerName = session.user.name;
		if (playerId !== session.user.id) {
			const [invitedGuest] = await db
				.select()
				.from(user)
				.where(and(eq(user.id, playerId), eq(user.invitedById, session.user.id)))
				.limit(1);
			if (invitedGuest) {
				playerName = invitedGuest.name;
			}
		}

		if (wasListed) {
			const [originalTx] = await db
				.select()
				.from(balanceTransaction)
				.where(
					and(
						eq(balanceTransaction.userId, payerId),
						eq(balanceTransaction.reference, eventId),
						eq(balanceTransaction.type, 'signup_deduction')
					)
				)
				.orderBy(desc(balanceTransaction.date))
				.limit(1);

			if (originalTx) {
				const refundAmount = Math.abs(originalTx.amount);

				const [payer] = await db.select().from(user).where(eq(user.id, payerId)).limit(1);
				await db
					.update(user)
					.set({ balance: payer.balance + refundAmount, updatedAt: new Date() })
					.where(eq(user.id, payerId));

				await db.insert(balanceTransaction).values({
					id: crypto.randomUUID(),
					userId: payerId,
					amount: refundAmount,
					reference: eventId,
					eventSignupId: signup.id,
					type: 'withdraw_refund',
					originalTransactionId: originalTx.id,
					notes:
						payerId !== playerId
							? `Withdrawal refund (Sponsored: ${playerName}): ${ev.title}`
							: `Withdrawal refund: ${ev.title}`,
					date: new Date()
				});
			}
		}

		await db.update(eventSignup).set({ status: 'withdrawn' }).where(eq(eventSignup.id, signup.id));

		if (wasListed) {
			const waitlisted = await db
				.select({
					signup: eventSignup,
					user: user
				})
				.from(eventSignup)
				.innerJoin(user, eq(eventSignup.userId, user.id))
				.where(and(eq(eventSignup.eventId, eventId), eq(eventSignup.status, 'waitlist')))
				.orderBy(eventSignup.createdAt);

			for (const wl of waitlisted) {
				const wlSignup = wl.signup;
				const wlUser = wl.user;
				const wlPayerId = wlSignup.paidById ?? wlUser.id;
				const [wlPayer] = await db.select().from(user).where(eq(user.id, wlPayerId)).limit(1);

				const cost = wlSignup.paidById
					? ev.costPlusOne
					: wlUser.accountType === 'company'
						? ev.costCompany
						: ev.costPlusOne;

				if (cost === 0 || wlPayer.balance >= cost) {
					await db
						.update(eventSignup)
						.set({ status: 'listed' })
						.where(eq(eventSignup.id, wlSignup.id));

					if (cost > 0) {
						await db
							.update(user)
							.set({ balance: wlPayer.balance - cost, updatedAt: new Date() })
							.where(eq(user.id, wlPayerId));

						await db.insert(balanceTransaction).values({
							id: crypto.randomUUID(),
							userId: wlPayerId,
							amount: -cost,
							reference: eventId,
							eventSignupId: wlSignup.id,
							type: 'signup_deduction',
							notes: wlSignup.paidById
								? `Event signup (Sponsored: ${wlUser.name}): ${ev.title}`
								: `Event signup: ${ev.title}`,
							date: new Date()
						});
					}
					break;
				} else {
					await db
						.update(eventSignup)
						.set({ status: 'removed' })
						.where(eq(eventSignup.id, wlSignup.id));
				}
			}
		}

		return { success: true };
	}
};
