import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup } from '$lib/server/db/schema';
import { asc, eq, lt, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	// Guard route to admin only
	const session = locals.session;

	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const showPast = url.searchParams.get('showPast') === 'true';
	const now = new Date();

	// Fetch all events
	const allEvents = await db.select().from(event).orderBy(asc(event.date));

	// Filter by past status if needed
	const events = showPast
		? allEvents
		: allEvents.filter(
				(ev) => new Date(ev.date).getTime() + ev.duration * 60 * 1000 > now.getTime()
			);

	// Fetch enrollment and waitlist counts per event
	const counts = await db
		.select({
			eventId: eventSignup.eventId,
			enrolled: sql<number>`SUM(CASE WHEN ${eventSignup.status} IN ('listed', 'locked') THEN 1 ELSE 0 END)`,
			waitlisted: sql<number>`SUM(CASE WHEN ${eventSignup.status} = 'waitlist' THEN 1 ELSE 0 END)`
		})
		.from(eventSignup)
		.groupBy(eventSignup.eventId);

	const countMap: Record<string, { enrolled: number; waitlisted: number }> = {};
	for (const c of counts) {
		countMap[c.eventId] = { enrolled: Number(c.enrolled), waitlisted: Number(c.waitlisted) };
	}

	return {
		events,
		showPast,
		countMap
	};
}) satisfies PageServerLoad;
