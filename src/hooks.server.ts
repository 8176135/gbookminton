import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { pollUpBankTransactions } from '$lib/server/upbank';
import { processDeadlines } from '$lib/server/deadline';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { companyDomain } from '$lib/server/db/schema';

// Start background poller once (handles HMR reloads in dev properly)
if (!(globalThis as any).upPollerStarted && !building) {
	(globalThis as any).upPollerStarted = true;

	// Initial runs
	pollUpBankTransactions();
	processDeadlines();

	// Intervals
	// Note: In a production environment, you might want to use a more robust task runner.
	setInterval(pollUpBankTransactions, 30 * 60 * 1000); // 30 mins
	setInterval(processDeadlines, 60 * 1000); // 1 min
}

export const handle: Handle = async ({ event, resolve }) => {
	// Intercept and restrict public email signups to company domains only
	if (event.request.method === 'POST' && event.url.pathname === '/api/auth/sign-up/email') {
		try {
			const clone = event.request.clone();
			const body = await clone.json();
			const email = (body.email || '').trim().toLowerCase();
			const emailDomain = email.split('@')[1] || '';

			const domains = await db.select({ domain: companyDomain.domain }).from(companyDomain);
			const isCompanyDomain = domains.some((d) => d.domain.toLowerCase() === emailDomain);

			if (!isCompanyDomain) {
				return new Response(
					JSON.stringify({
						message:
							'Registration is restricted to authorized company email domains. Plus-one accounts must be invited by a company user.'
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}
		} catch (err) {
			// Let standard handlers handle malformed requests
		}
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session;
	event.locals.user = session?.user ?? null;

	return svelteKitHandler({ event, resolve, auth, building });
};
