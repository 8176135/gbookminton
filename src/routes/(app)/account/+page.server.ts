import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user, companyDomain, account } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { updateUserAccountType } from '$lib/server/account';
import type { PageServerLoad, Actions } from './$types';
import { hashPassword } from 'better-auth/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(302, '/login');
	}

	const now = new Date();

	// Get user details
	const [currentUser] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			accountType: user.accountType,
			balance: user.balance,
			shortCode: user.shortCode,
			createdAt: user.createdAt,
			adminDeadlineDays: user.adminDeadlineDays,
			adminDeadlineTime: user.adminDeadlineTime,
			allowedPlusOnes: user.allowedPlusOnes
		})
		.from(user)
		.where(eq(user.id, locals.session.user.id))
		.limit(1);

	if (!currentUser) {
		throw redirect(302, '/login');
	}

	// Get invited plus-ones
	let invitedPlusOnes: any[] = [];
	if (currentUser.accountType === 'company' || currentUser.role === 'admin') {
		invitedPlusOnes = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				balance: user.balance,
				createdAt: user.createdAt
			})
			.from(user)
			.where(eq(user.invitedById, currentUser.id))
			.orderBy(desc(user.createdAt));
	}

	// Get user's event registrations with event details
	const userRegistrations = await db
		.select({
			event: event,
			signup: eventSignup
		})
		.from(eventSignup)
		.innerJoin(event, eq(eventSignup.eventId, event.id))
		.where(eq(eventSignup.userId, currentUser.id))
		.orderBy(desc(event.date));

	// Filter to past events only
	const pastEvents = userRegistrations
		.filter(({ event: ev }) => {
			const endTime = new Date(new Date(ev.date).getTime() + ev.duration * 60 * 1000);
			return endTime < now;
		})
		.map(({ event: ev, signup }) => ({
			id: ev.id,
			title: ev.title,
			date: ev.date,
			location: ev.location,
			duration: ev.duration,
			cost: signup.status === 'locked' || signup.status === 'listed' ? ev.costCompany : 0,
			signupStatus: signup.status
		}));

	return {
		user: currentUser,
		pastEvents,
		invitedPlusOnes: invitedPlusOnes.map((p) => ({
			...p,
			createdAt: p.createdAt.toISOString()
		})),
		invitedCount: invitedPlusOnes.length
	};
};

export const actions: Actions = {
	updateEmail: async ({ request, locals }) => {
		if (!locals.session) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const newEmail = (data.get('email') as string)?.toLowerCase().trim();

		if (!newEmail) {
			return fail(400, { error: 'Email is required' });
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return fail(400, { error: 'Invalid email format' });
		}

		const userId = locals.session.user.id;

		// Check if email domain is valid
		const emailDomain = newEmail.split('@')[1] || '';
		const domains = await db.select({ domain: companyDomain.domain }).from(companyDomain);
		const isCompanyDomain = domains.some((d) => d.domain.toLowerCase() === emailDomain);

		if (!isCompanyDomain) {
			return fail(400, { error: 'Your email address must belong to a registered company domain.' });
		}

		// Check if email is already in use by another user
		const existingUser = await db.select().from(user).where(eq(user.email, newEmail)).limit(1);

		if (existingUser.length > 0 && existingUser[0].id !== userId) {
			return fail(400, { error: 'This email is already in use by another account' });
		}

		// Update email and re-evaluate account type
		await db
			.update(user)
			.set({ email: newEmail, updatedAt: new Date() })
			.where(eq(user.id, userId));

		// Re-evaluate account type based on new email
		await updateUserAccountType(userId, newEmail);

		return {
			success: true,
			message:
				'Email updated successfully. Your account type has been adjusted based on your new email domain.'
		};
	},
	invitePlusOne: async ({ request, locals }) => {
		if (!locals.session) {
			throw redirect(302, '/login');
		}

		const activeUser = locals.session.user;
		if (activeUser.accountType !== 'company' && activeUser.role !== 'admin') {
			return fail(403, { error: 'Only Company accounts and Admin users can invite Plus-Ones.' });
		}

		const data = await request.formData();
		const plusOneName = (data.get('name') as string)?.trim();
		const plusOneEmail = (data.get('email') as string)?.toLowerCase().trim();
		const passwordInput = data.get('password') as string;

		if (!plusOneName || !plusOneEmail || !passwordInput) {
			return fail(400, { error: 'All fields are required.' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(plusOneEmail)) {
			return fail(400, { error: 'Invalid email format.' });
		}

		if (passwordInput.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}

		if (activeUser.role !== 'admin') {
			const [inviterData] = await db
				.select({ allowedPlusOnes: user.allowedPlusOnes })
				.from(user)
				.where(eq(user.id, activeUser.id))
				.limit(1);

			const allowedCount = inviterData?.allowedPlusOnes ?? 1;

			const invitedResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(user)
				.where(eq(user.invitedById, activeUser.id));

			const invitedCount = Number(invitedResult[0]?.count ?? 0);

			if (invitedCount >= allowedCount) {
				return fail(400, {
					error: `You have reached your limit of invited plus-one accounts (${allowedCount}).`
				});
			}
		}

		const existingUser = await db.select().from(user).where(eq(user.email, plusOneEmail)).limit(1);

		if (existingUser.length > 0) {
			return fail(400, { error: 'An account with this email address already exists.' });
		}

		try {
			const hashedPassword = await hashPassword(passwordInput);

			const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
			let shortCode = '';
			let isUnique = false;
			while (!isUnique) {
				shortCode = '';
				for (let i = 0; i < 6; i++) {
					shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
				}
				const existingShortCode = await db
					.select()
					.from(user)
					.where(eq(user.shortCode, shortCode))
					.limit(1);
				if (existingShortCode.length === 0) {
					isUnique = true;
				}
			}

			const newUserId = crypto.randomUUID();

			await db.transaction(async (tx) => {
				await tx.insert(user).values({
					id: newUserId,
					name: plusOneName,
					email: plusOneEmail,
					emailVerified: true,
					balance: 0,
					shortCode,
					role: 'user',
					accountType: 'plusone',
					invitedById: activeUser.id,
					allowedPlusOnes: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				await tx.insert(account).values({
					id: crypto.randomUUID(),
					accountId: plusOneEmail,
					providerId: 'credential',
					userId: newUserId,
					password: hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			});

			return {
				inviteSuccess: true,
				message: `Plus-One '${plusOneName}' was invited successfully!`
			};
		} catch (err: any) {
			console.error('Error inviting plusone:', err);
			return fail(500, { error: 'Failed to complete plus-one invitation.' });
		}
	},
	updateAdminSettings: async ({ request, locals }) => {
		if (!locals.session || locals.session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const days = parseInt(data.get('adminDeadlineDays') as string, 10);
		const time = data.get('adminDeadlineTime') as string;

		if (isNaN(days) || !time) {
			return fail(400, { error: 'Invalid settings' });
		}

		const userId = locals.session.user.id;

		await db
			.update(user)
			.set({ adminDeadlineDays: days, adminDeadlineTime: time, updatedAt: new Date() })
			.where(eq(user.id, userId));

		return {
			adminSettingsSuccess: true,
			message: 'Admin preferences updated successfully.'
		};
	}
};
