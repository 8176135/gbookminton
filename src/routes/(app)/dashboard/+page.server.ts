import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventSignup, user } from '$lib/server/db/schema';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const session = locals.session;
    if (!session) {
        throw redirect(302, '/login');
    }

    // Get user details
    const [currentUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

    // Get upcoming events (not locked)
    const upcomingEvents = await db.select().from(event).where(eq(event.isLocked, false)).orderBy(event.date);

    // Get signed up events for this user
    const userSignups = await db.select().from(eventSignup).where(eq(eventSignup.userId, session.user.id));

    // Create a map to easily check user's status for each event
    const signupStatusMap: Record<string, string> = {};
    for (const signup of userSignups) {
        signupStatusMap[signup.eventId] = signup.status;
    }

    // Also get the current total enrolled players per event
    const query = db.select({
        eventId: eventSignup.eventId,
        count: sql<number>`count(${eventSignup.id})`
    })
        .from(eventSignup)
        .where(and(eq(eventSignup.status, 'listed'), eq(eventSignup.status, 'locked'))) // waitlist doesn't count towards capacity
        .groupBy(eventSignup.eventId);

    const enrollmentCounts = await query;
    const capacityMap: Record<string, number> = {};
    for (const count of enrollmentCounts) {
        capacityMap[count.eventId] = count.count;
    }

    return {
        user: currentUser,
        events: upcomingEvents,
        signupStatusMap,
        capacityMap
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    signup: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) throw redirect(302, '/login');

        const data = await request.formData();
        const eventId = data.get('eventId') as string;

        const [ev] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
        if (!ev) return { error: 'Event not found' };

        if (new Date(ev.deadline).getTime() < Date.now()) {
            return { error: 'Registration deadline has passed' };
        }

        // Check if already signed up (not withdrawn/removed)
        const [existing] = await db.select().from(eventSignup).where(and(eq(eventSignup.userId, session.user.id), eq(eventSignup.eventId, eventId))).limit(1);
        if (existing && existing.status !== 'withdrawn' && existing.status !== 'removed') {
            return { error: 'Already signed up' };
        }

        // Count enrolled
        const [{ count }] = await db.select({ count: sql<number>`count(${eventSignup.id})` })
            .from(eventSignup)
            .where(and(eq(eventSignup.eventId, eventId), sql`${eventSignup.status} IN ('listed', 'locked')`));

        const status = count < ev.capacity ? 'listed' : 'waitlist';

        if (existing) {
            await db.update(eventSignup).set({ status, createdAt: new Date() }).where(eq(eventSignup.id, existing.id));
        } else {
            await db.insert(eventSignup).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                eventId,
                status,
                createdAt: new Date()
            });
        }
    },

    withdraw: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) throw redirect(302, '/login');

        const data = await request.formData();
        const eventId = data.get('eventId') as string;

        const [ev] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
        if (!ev) return { error: 'Event not found' };

        if (new Date(ev.deadline).getTime() < Date.now()) {
            return { error: 'Registration deadline has passed, cannot withdraw' };
        }

        const [signup] = await db.select().from(eventSignup).where(and(eq(eventSignup.userId, session.user.id), eq(eventSignup.eventId, eventId))).limit(1);
        if (!signup || signup.status === 'withdrawn' || signup.status === 'removed' || signup.status === 'locked') {
            return { error: 'Cannot withdraw' };
        }

        const wasListed = signup.status === 'listed';

        await db.update(eventSignup).set({ status: 'withdrawn' }).where(eq(eventSignup.id, signup.id));

        // If user was listed, promote the first waitlisted person
        if (wasListed) {
            const [firstWaitlist] = await db.select().from(eventSignup)
                .where(and(eq(eventSignup.eventId, eventId), eq(eventSignup.status, 'waitlist')))
                .orderBy(eventSignup.createdAt)
                .limit(1);

            if (firstWaitlist) {
                await db.update(eventSignup).set({ status: 'listed' }).where(eq(eventSignup.id, firstWaitlist.id));
            }
        }
    }
};
