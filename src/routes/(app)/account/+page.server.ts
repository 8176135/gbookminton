import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { updateUserAccountType } from '$lib/server/account';
import type { PageServerLoad, Actions } from './$types';

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
			adminDeadlineTime: user.adminDeadlineTime
		})
		.from(user)
		.where(eq(user.id, locals.session.user.id))
		.limit(1);

	if (!currentUser) {
		throw redirect(302, '/login');
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
		pastEvents
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
