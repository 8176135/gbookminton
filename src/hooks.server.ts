import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/server/auth";
import { pollUpBankTransactions } from "$lib/server/upbank";
import { processDeadlines } from "$lib/server/deadline";
import type { Handle } from "@sveltejs/kit";
import { building } from "$app/environment";

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
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    event.locals.session = session;
    event.locals.user = session?.user ?? null;

    return svelteKitHandler({ event, resolve, auth, building });
};
