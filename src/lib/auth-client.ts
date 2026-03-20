import { createAuthClient } from "better-auth/svelte";

// We can rely on standard Better Auth conventions and let it infer the URL
export const authClient = createAuthClient({
    // You can pass configuration options here if needed later
});
