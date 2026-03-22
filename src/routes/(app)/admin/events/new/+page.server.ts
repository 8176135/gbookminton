import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	// @ts-ignore - Better Auth custom fields (temporary until sync)
	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = locals.session;
		// @ts-ignore
		if (!session || session.user.role !== 'admin') {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const dateStr = data.get('date') as string;
		const duration = parseInt(data.get('duration') as string, 10);
		const location = data.get('location') as string;
		const description = data.get('description') as string;
		const capacity = parseInt(data.get('capacity') as string, 10);
		const costDollars = parseFloat(data.get('cost') as string);
		const deadlineStr = data.get('deadline') as string;
		const isPrivate = data.get('isPrivate') === 'true';

		const costCents = Math.round(costDollars * 100);

		await db.insert(event).values({
			id: crypto.randomUUID(),
			title,
			date: new Date(dateStr),
			location,
			duration,
			description,
			capacity,
			cost: costCents,
			deadline: new Date(deadlineStr),
			isPrivate,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		throw redirect(303, '/admin');
	}
};
