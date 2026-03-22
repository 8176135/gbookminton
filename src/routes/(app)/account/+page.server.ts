import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(302, '/login');
	}

	const now = new Date();

	// Get user's event registrations with event details
	const userId = locals.user!.id;

	// Get user's event registrations with event details
	const userRegistrations = await db
		.select({
			event: event,
			signup: eventSignup
		})
		.from(eventSignup)
		.innerJoin(event, eq(eventSignup.eventId, event.id))
		.where(eq(eventSignup.userId, userId))
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
			cost: ev.cost,
			signupStatus: signup.status
		}));

	return {
		user: locals.user,
		pastEvents
	};
};
