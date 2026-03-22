import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { companyDomain, user } from '$lib/server/db/schema';
import { eq, like } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session || session.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	// Fetch all company domains
	const domains = await db
		.select({
			id: companyDomain.id,
			domain: companyDomain.domain,
			createdAt: companyDomain.createdAt
		})
		.from(companyDomain)
		.orderBy(companyDomain.createdAt);

	return {
		domains: domains.map((d) => ({
			...d,
			createdAt: d.createdAt.toISOString()
		}))
	};
};

/**
 * Sync user account types based on company domains.
 * Users with company email domains become 'company', others become 'plusone'.
 */
async function syncAllUserAccountTypes() {
	// Get all company domains
	const domains = await db.select({ domain: companyDomain.domain }).from(companyDomain);
	const companyDomains = domains.map((d) => d.domain.toLowerCase());

	// Get all users
	const allUsers = await db
		.select({ id: user.id, email: user.email, accountType: user.accountType })
		.from(user);

	// Update each user based on their email domain
	for (const u of allUsers) {
		const emailDomain = u.email.split('@')[1]?.toLowerCase() || '';
		const shouldBeCompany = companyDomains.includes(emailDomain);
		const currentType = u.accountType;

		if (shouldBeCompany && currentType !== 'company') {
			await db
				.update(user)
				.set({ accountType: 'company', updatedAt: new Date() })
				.where(eq(user.id, u.id));
		} else if (!shouldBeCompany && currentType !== 'plusone') {
			await db
				.update(user)
				.set({ accountType: 'plusone', updatedAt: new Date() })
				.where(eq(user.id, u.id));
		}
	}
}

export const actions: Actions = {
	addDomain: async ({ request, locals }) => {
		const session = locals.session;
		if (!session || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const domain = (data.get('domain') as string)?.toLowerCase().trim();

		if (!domain) {
			return fail(400, { error: 'Domain is required', domainError: 'Domain is required' });
		}

		// Basic validation
		if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
			return fail(400, {
				error: 'Invalid domain format',
				domainError: 'Invalid domain format (e.g., example.com)'
			});
		}

		// Check if domain already exists
		const existing = await db
			.select()
			.from(companyDomain)
			.where(eq(companyDomain.domain, domain))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, {
				error: 'Domain already exists',
				domainError: 'This domain is already in the list'
			});
		}

		await db.insert(companyDomain).values({
			id: crypto.randomUUID(),
			domain,
			createdAt: new Date()
		});

		// Sync all users: users with this domain become 'company'
		await syncAllUserAccountTypes();

		return { success: true };
	},

	removeDomain: async ({ request, locals }) => {
		const session = locals.session;
		if (!session || session.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const domainId = data.get('domainId') as string;

		if (!domainId) {
			return fail(400, { error: 'Domain ID is required' });
		}

		// Get the domain before deleting
		const [domainRecord] = await db
			.select()
			.from(companyDomain)
			.where(eq(companyDomain.id, domainId))
			.limit(1);

		if (!domainRecord) {
			return fail(400, { error: 'Domain not found' });
		}

		const domainToRemove = domainRecord.domain;

		// Delete the domain
		await db.delete(companyDomain).where(eq(companyDomain.id, domainId));

		// Sync all users: users with this domain become 'plusone'
		await syncAllUserAccountTypes();

		return { success: true };
	}
};
