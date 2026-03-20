import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
    const session = locals.session;
    if (!session || session.user.role !== 'admin') {
        throw redirect(302, '/dashboard');
    }

    const { id } = params;

    const [ev] = await db.select().from(event).where(eq(event.id, id)).limit(1);
    if (!ev) throw redirect(302, '/admin');

    const signups = await db.select({
        signup: eventSignup,
        user: user
    })
        .from(eventSignup)
        .innerJoin(user, eq(eventSignup.userId, user.id))
        .where(eq(eventSignup.eventId, id));

    return {
        event: ev,
        signups
    };
}) satisfies PageServerLoad;
