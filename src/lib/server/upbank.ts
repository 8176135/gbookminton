import { db } from './db';
import { user, transaction } from './db/schema';
import { env } from '$env/dynamic/private';
import { desc, eq } from 'drizzle-orm';

// Polls the Up Bank API for new transactions and updates user balances
export async function pollUpBankTransactions() {
    if (!env.UP_BANK_API_KEY) {
        console.warn('UP_BANK_API_KEY is not set. Skipping Up Bank polling.');
        return;
    }

    console.log('Polling Up Bank for new transactions...');

    try {
        // 1. Get the date of our latest processed transaction to use as `since`
        const [latestTx] = await db.select().from(transaction).orderBy(desc(transaction.date)).limit(1);

        let url = 'https://api.up.com.au/api/v1/transactions?filter[status]=SETTLED';
        if (latestTx) {
            // Go back one minute to ensure we catch any transactions that might have been settled near the same time
            const sinceDate = new Date(latestTx.date.getTime() - 60000).toISOString();
            url += `&filter[since]=${sinceDate}`;
        }

        let hasNextPage = true;

        while (url && hasNextPage) {
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${env.UP_BANK_API_KEY}`
                }
            });

            if (!res.ok) {
                console.error('Failed to fetch from Up Bank API:', await res.text());
                break;
            }

            const data = await res.json();
            const upTransactions = data.data;

            for (const upTx of upTransactions) {
                const txId = upTx.id;
                const amount = Math.round(parseFloat(upTx.attributes.amount.value) * 100); // converting to cents
                const message = upTx.attributes.message || upTx.attributes.description || '';
                const txDate = new Date(upTx.attributes.createdAt);

                // Only care about positive deposits
                if (amount <= 0) continue;

                // 2. Extract potential shortCodes from the message
                // Our shortcodes are 6 character uppercase alphanumeric
                const regex = /\\b[A-Z2-9]{6}\\b/g;
                const matches = message.match(regex);

                if (!matches || matches.length === 0) continue;

                // Check if we already processed this transaction id
                const [existingTx] = await db.select().from(transaction).where(eq(transaction.reference, txId)).limit(1);
                if (existingTx) continue;

                // Look up the user by shortCode
                for (const code of matches) {
                    const [matchedUser] = await db.select().from(user).where(eq(user.shortCode, code)).limit(1);

                    if (matchedUser) {
                        // 3. User found! Record the transaction and increment balance
                        console.log(`Matched deposit of ${amount} cents to user ${matchedUser.email} (Code: ${code})`);

                        await db.transaction(async (tx) => {
                            // Insert Audit Record
                            await tx.insert(transaction).values({
                                id: crypto.randomUUID(),
                                userId: matchedUser.id,
                                amount: amount,
                                reference: txId,
                                type: 'deposit',
                                date: txDate
                            });

                            // Update balance
                            await tx.update(user).set({
                                balance: matchedUser.balance + amount
                            }).where(eq(user.id, matchedUser.id));
                        });

                        break; // Stop looking for further shortcodes in this message
                    }
                }
            }

            // Pagination
            url = data.links?.next || null;
            if (!url) hasNextPage = false;
        }

    } catch (error) {
        console.error('Error polling Up Bank transactions:', error);
    }
}
