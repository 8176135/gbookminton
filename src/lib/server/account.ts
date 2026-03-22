import { db } from './db';
import { companyDomain, user } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * Determines account type based on email domain matching company domains.
 * If the email domain matches any company domain, returns 'company', otherwise 'plusone'.
 */
export async function determineAccountType(email: string): Promise<'company' | 'plusone'> {
	const emailDomain = email.split('@')[1]?.toLowerCase();
	if (!emailDomain) return 'plusone';

	// Get all company domains
	const domains = await db.select({ domain: companyDomain.domain }).from(companyDomain);

	// Check if email domain matches any company domain
	for (const { domain } of domains) {
		if (domain.toLowerCase() === emailDomain) {
			return 'company';
		}
	}

	return 'plusone';
}

/**
 * Updates a user's account type based on their current email.
 */
export async function updateUserAccountType(userId: string, email: string): Promise<void> {
	const newType = await determineAccountType(email);
	await db
		.update(user)
		.set({ accountType: newType, updatedAt: new Date() })
		.where(eq(user.id, userId));
}
