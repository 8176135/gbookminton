import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { balanceTransaction, user, eventSignup, event } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

import { env } from '$env/dynamic/private';

function escapeCsv(val: unknown): string {
	if (val === null || val === undefined) return '';
	const str = String(val);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const token = url.searchParams.get('token');
	const secretToken = env.EXPORT_SECRET_TOKEN;

	let isAuthorized = false;

	if (secretToken && token === secretToken) {
		// TODO: Temporarily disable this access method
		// isAuthorized = true;
	} else {
		const session = locals.session;
		if (session && session.user.role === 'admin') {
			isAuthorized = true;
		}
	}

	if (!isAuthorized) {
		throw error(403, 'Unauthorized');
	}

	try {
		// Fetch all transactions with joined user and event details
		const transactions = await db
			.select({
				id: balanceTransaction.id,
				date: balanceTransaction.date,
				amount: balanceTransaction.amount,
				type: balanceTransaction.type,
				reference: balanceTransaction.reference,
				notes: balanceTransaction.notes,
				originalTransactionId: balanceTransaction.originalTransactionId,
				eventSignupId: balanceTransaction.eventSignupId,
				userName: user.name,
				userEmail: user.email,
				eventTitle: event.title
			})
			.from(balanceTransaction)
			.innerJoin(user, eq(balanceTransaction.userId, user.id))
			.leftJoin(eventSignup, eq(balanceTransaction.eventSignupId, eventSignup.id))
			.leftJoin(event, eq(eventSignup.eventId, event.id))
			.orderBy(desc(balanceTransaction.date));

		// Define headers
		const headers = [
			'Transaction ID',
			'Date',
			'User Name',
			'User Email',
			'Amount ($)',
			'Type',
			'Reference',
			'Original Transaction ID',
			'Event Title',
			'Event Signup ID',
			'Notes'
		];

		// Build CSV content
		const csvRows = [headers.join(',')];

		for (const tx of transactions) {
			const formattedDate = new Date(Number(tx.date) * 1000).toISOString();
			const formattedAmount = (Number(tx.amount) / 100).toFixed(2);

			const row = [
				escapeCsv(tx.id),
				escapeCsv(formattedDate),
				escapeCsv(tx.userName),
				escapeCsv(tx.userEmail),
				escapeCsv(formattedAmount),
				escapeCsv(tx.type),
				escapeCsv(tx.reference),
				escapeCsv(tx.originalTransactionId),
				escapeCsv(tx.eventTitle),
				escapeCsv(tx.eventSignupId),
				escapeCsv(tx.notes)
			];

			csvRows.push(row.join(','));
		}

		const csvContent = csvRows.join('\n');

		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="gbookminton-transactions.csv"',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		});
	} catch (err) {
		console.error('Failed to export transactions CSV:', err);
		throw error(500, 'Failed to generate transaction CSV export');
	}
};
