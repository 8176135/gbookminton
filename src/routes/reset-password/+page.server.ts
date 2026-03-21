import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, locals }) => {
    if (locals.session) {
        throw redirect(303, '/dashboard');
    }
    const token = url.searchParams.get('token');
    if (!token) {
        throw error(400, 'Reset token is missing.');
    }
    return { token };
};
