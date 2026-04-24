import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ locals, params }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	const isAdmin = session.user.role === 'admin';
	const { id } = params;

	const [ev] = await db.select().from(event).where(eq(event.id, id)).limit(1);
	if (!ev) throw redirect(302, '/dashboard');

	const signups = await db
		.select({
			signup: eventSignup,
			user: user
		})
		.from(eventSignup)
		.innerJoin(user, eq(eventSignup.userId, user.id))
		.where(eq(eventSignup.eventId, id));

	const listed = signups.filter(
		(s) => s.signup.status === 'listed' || s.signup.status === 'locked'
	);
	const waitlist = signups
		.filter((s) => s.signup.status === 'waitlist')
		.sort((a, b) => a.signup.createdAt.getTime() - b.signup.createdAt.getTime());

	// Non-admins: if event is private, strip personal details
	if (!isAdmin && ev.isPrivate) {
		return {
			event: ev,
			isAdmin: false,
			listedCount: listed.length,
			waitlistCount: waitlist.length,
			signups: null,
			userSignupStatus:
				signups.find((s) => s.signup.userId === session.user.id)?.signup.status ?? null
		};
	}

	return {
		event: ev,
		isAdmin,
		listedCount: listed.length,
		waitlistCount: waitlist.length,
		signups: isAdmin
			? signups
			: signups.map((s) => ({
					signup: s.signup,
					// For public non-private events, show only the name (not email)
					user: { name: s.user.name, id: s.user.id, email: '' }
				})),
		userSignupStatus:
			signups.find((s) => s.signup.userId === session.user.id)?.signup.status ?? null,
		adminSettings: isAdmin ? {
			days: (session.user as any).adminDeadlineDays ?? 2,
			time: (session.user as any).adminDeadlineTime ?? '17:00'
		} : undefined
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	// Admin: edit all event details
	editEvent: async ({ request, locals, params }) => {
		const session = locals.session;
		if (!session || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const { id } = params;
		const data = await request.formData();

		const title = data.get('title') as string;
		const dateStr = data.get('date') as string;
		const duration = parseInt(data.get('duration') as string, 10);
		const location = data.get('location') as string;
		const description = data.get('description') as string;
		const capacity = parseInt(data.get('capacity') as string, 10);
		const costCompanyDollars = parseFloat(data.get('costCompany') as string);
		const costPlusOneDollars = parseFloat(data.get('costPlusOne') as string);
		const deadlineStr = data.get('deadline') as string;
		const isPrivate = data.get('isPrivate') === 'true';

		if (
			!title ||
			!dateStr ||
			!deadlineStr ||
			isNaN(duration) ||
			isNaN(capacity) ||
			isNaN(costCompanyDollars) ||
			isNaN(costPlusOneDollars)
		) {
			return fail(400, { error: 'Invalid form data' });
		}

		await db
			.update(event)
			.set({
				title,
				date: new Date(dateStr),
				duration,
				location,
				description,
				capacity,
				costCompany: Math.round(costCompanyDollars * 100),
				costPlusOne: Math.round(costPlusOneDollars * 100),
				deadline: new Date(deadlineStr),
				isPrivate,
				updatedAt: new Date()
			})
			.where(eq(event.id, id));

		return { success: true };
	}
};
