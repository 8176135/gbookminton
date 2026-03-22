import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	// Fetch all users ordered by createdAt descending
	const allUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			accountType: user.accountType,
			balance: user.balance,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(user.createdAt);

	return {
		users: allUsers.map((u) => ({
			...u,
			createdAt: u.createdAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	updateAccountType: async ({ request, locals }) => {
		const session = locals.session;
		if (!session || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const accountType = data.get('accountType') as string;

		if (!userId || !accountType || !['company', 'plusone'].includes(accountType)) {
			return fail(400, { error: 'Invalid data' });
		}

		await db.update(user).set({ accountType, updatedAt: new Date() }).where(eq(user.id, userId));

		return { success: true };
	}
};
