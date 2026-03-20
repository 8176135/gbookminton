import { db } from './db';
import { event, eventSignup, user, transaction } from './db/schema';
import { and, eq, lte } from 'drizzle-orm';

export async function processDeadlines() {
    console.log('Running automated deadline processing...');
    try {
        // Find events that passed deadline and are not locked
        const passedEvents = await db.select().from(event).where(and(lte(event.deadline, new Date()), eq(event.isLocked, false)));

        for (const ev of passedEvents) {
            console.log(`Locking event ${ev.title} (ID: ${ev.id})...`);

            // Get all signups for this event
            const signups = await db.select({
                signup: eventSignup,
                user: user
            }).from(eventSignup)
                .innerJoin(user, eq(eventSignup.userId, user.id))
                .where(eq(eventSignup.eventId, ev.id));

            await db.transaction(async (tx) => {
                for (const row of signups) {
                    const { signup, user: u } = row;

                    if (signup.status === 'listed') {
                        if (u.balance >= ev.cost) {
                            // Deduct balance
                            await tx.update(user)
                                .set({ balance: u.balance - ev.cost })
                                .where(eq(user.id, u.id));

                            // Lock signup
                            await tx.update(eventSignup)
                                .set({ status: 'locked' })
                                .where(eq(eventSignup.id, signup.id));

                            // Record deduction
                            await tx.insert(transaction).values({
                                id: crypto.randomUUID(),
                                userId: u.id,
                                amount: -ev.cost, // negative for deductions
                                reference: ev.id,
                                type: 'deduction',
                                date: new Date()
                            });
                        } else {
                            // Remove due to insufficient funds
                            await tx.update(eventSignup)
                                .set({ status: 'removed' })
                                .where(eq(eventSignup.id, signup.id));
                        }
                    } else if (signup.status === 'waitlist') {
                        // Waitlist members don't get in; mark them as withdrawn or keep them on waitlist
                        await tx.update(eventSignup)
                            .set({ status: 'withdrawn' })
                            .where(eq(eventSignup.id, signup.id));
                    }
                }

                // Mark event as locked
                await tx.update(event).set({ isLocked: true }).where(eq(event.id, ev.id));
            });
        }
    } catch (error) {
        console.error('Error processing deadlines:', error);
    }
}
