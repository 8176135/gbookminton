import { auth } from "$lib/server/auth";

export const fallback = async ({ request }) => {
    return auth.handler(request);
};
