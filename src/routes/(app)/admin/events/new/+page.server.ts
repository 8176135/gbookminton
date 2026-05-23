import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	// @ts-ignore - Better Auth custom fields (temporary until sync)
	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const templateId = url.searchParams.get('templateId');
	let templateEvent: any = null;
	if (templateId) {
		const [found] = await db.select().from(event).where(eq(event.id, templateId)).limit(1);
		if (found) {
			const adjustedDate = new Date(found.date);
			adjustedDate.setDate(adjustedDate.getDate() + 7);

			const adjustedDeadline = new Date(found.deadline);
			adjustedDeadline.setDate(adjustedDeadline.getDate() + 7);

			templateEvent = {
				...found,
				date: adjustedDate,
				deadline: adjustedDeadline
			};
		}
	}

	const allEvents = await db.select().from(event).orderBy(desc(event.date));

	return {
		adminSettings: {
			days: (session.user as any).adminDeadlineDays ?? 2,
			time: (session.user as any).adminDeadlineTime ?? '17:00'
		},
		events: allEvents,
		templateEvent
	};
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
		const costCompanyDollars = parseFloat(data.get('costCompany') as string);
		const costPlusOneDollars = parseFloat(data.get('costPlusOne') as string);
		const deadlineStr = data.get('deadline') as string;
		const visibility = (data.get('visibility') as string) || 'onlyCompany';

		if (
			!title ||
			!dateStr ||
			!deadlineStr ||
			isNaN(duration) ||
			isNaN(capacity) ||
			isNaN(costCompanyDollars) ||
			isNaN(costPlusOneDollars)
		) {
			return fail(400, {
				error: 'Please fill in all fields correctly (including Date and Deadline).'
			});
		}

		await db.insert(event).values({
			id: crypto.randomUUID(),
			title,
			date: new Date(dateStr),
			location,
			duration,
			description,
			capacity,
			costCompany: Math.round(costCompanyDollars * 100),
			costPlusOne: Math.round(costPlusOneDollars * 100),
			deadline: new Date(deadlineStr),
			visibility,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		throw redirect(303, '/admin');
	}
};
