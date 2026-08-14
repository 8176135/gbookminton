import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { pollUpBankTransactions } from '$lib/server/upbank';
import { processDeadlines } from '$lib/server/deadline';
import { runBackupSnapshot } from '$lib/server/snapshot';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { companyDomain } from '$lib/server/db/schema';

let activeRequestsCount = 0;
let isShuttingDown = false;

interface GlobalWithPoller {
	upPollerStarted?: boolean;
}

const globalState = globalThis as GlobalWithPoller;

// Start background poller once (handles HMR reloads in dev properly)
if (!globalState.upPollerStarted && !building) {
	globalState.upPollerStarted = true;

	// Initial runs
	pollUpBankTransactions();
	processDeadlines();
	runBackupSnapshot();

	// Configurable snapshot interval (default to 24 hours in ms)
	const snapshotIntervalMs = process.env.SNAPSHOT_INTERVAL_MS
		? parseInt(process.env.SNAPSHOT_INTERVAL_MS, 10)
		: 24 * 60 * 60 * 1000;

	// Intervals
	// Note: In a production environment, you might want to use a more robust task runner.
	const pollInterval = setInterval(pollUpBankTransactions, 30 * 60 * 1000); // 30 mins
	const deadlineInterval = setInterval(processDeadlines, 60 * 1000); // 1 min
	const snapshotInterval = setInterval(runBackupSnapshot, snapshotIntervalMs);

	const shutdown = async (signal: string) => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		console.log(`Received ${signal}, starting graceful shutdown...`);

		// Clear intervals
		clearInterval(pollInterval);
		clearInterval(deadlineInterval);
		clearInterval(snapshotInterval);
		console.log('Background intervals cleared.');

		const timeout = 5000; // 5 seconds grace period
		const startTime = Date.now();

		while (activeRequestsCount > 0) {
			if (Date.now() - startTime > timeout) {
				console.warn(
					`Graceful shutdown timeout reached! Force-killing ${activeRequestsCount} active request(s).`
				);
				process.exit(1);
			}
			console.log(`Waiting for ${activeRequestsCount} active request(s) to finish...`);
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		console.log('All active requests completed. Exiting cleanly.');
		process.exit(0);
	};

	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export const handle: Handle = async ({ event, resolve }) => {
	if (isShuttingDown) {
		return new Response('Service Unavailable', {
			status: 503,
			headers: { 'Retry-After': '10' }
		});
	}

	activeRequestsCount++;
	try {
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
			} catch {
				// Let standard handlers handle malformed requests
			}
		}

		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		event.locals.session = session;
		event.locals.user = session?.user ?? null;

		return await svelteKitHandler({ event, resolve, auth, building });
	} finally {
		activeRequestsCount--;
	}
};
