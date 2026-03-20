import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    // Guard route to admin only
    const session = locals.session;

    if (!session || session.user.role !== 'admin') {
        throw redirect(302, '/dashboard');
    }

    const allEvents = await db.select().from(event).orderBy(desc(event.date));

    return {
        events: allEvents
    };
}) satisfies PageServerLoad;
