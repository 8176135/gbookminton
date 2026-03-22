import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { asc, desc, lt, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	// Guard route to admin only
	const session = locals.session;

	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const showPast = url.searchParams.get('showPast') === 'true';
	const now = new Date();

	// Sort by date ascending (earliest first), with past events at the bottom if showing them
	let query = db.select().from(event).orderBy(asc(event.date));

	let events;
	if (showPast) {
		events = await query;
	} else {
		// Only show upcoming and current events
		events = await db
			.select()
			.from(event)
			.where(lt(event.date, sql`datetime('now', '+10 years')`))
			.orderBy(asc(event.date));
		// Filter out past events client-side for cleaner separation
		events = events.filter(
			(ev) => new Date(ev.date).getTime() + ev.duration * 60 * 1000 > now.getTime()
		);
	}

	return {
		events,
		showPast
	};
}) satisfies PageServerLoad;
