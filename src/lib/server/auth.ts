import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// Strict Startup Verification for RESEND_FROM env
if (!building) {
	if (!env.RESEND_FROM) {
		console.error('\n============================================================');
		console.error('❌ FATAL STARTUP ERROR: RESEND_FROM is not defined!');
		console.error('Please configure RESEND_FROM in your environment or .env file.');
		console.error('Example: RESEND_FROM="Gbookminton <noreply@gbookminton.com>"');
		console.error('============================================================\n');
		process.exit(1);
	}
}


export const auth = betterAuth({
	// Vite sets NODE_ENV=production during `vite build`, and better-auth refuses a
	// default/invalid secret under production. During the SvelteKit build the server
	// entry is evaluated to extract route metadata, so hand it a throwaway secret —
	// at runtime the real BETTER_AUTH_SECRET is always used (and still fail-fast if missing).
	secret: building
		? 'gbookminton-build-time-secret-placeholder-only'
		: (env.BETTER_AUTH_SECRET as string | undefined),
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	trustedOrigins: [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:5173',
		...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [])
	],
	user: {
		additionalFields: {
			role: { type: 'string', required: true, defaultValue: 'user' },
			balance: { type: 'number', required: true, defaultValue: 0 },
			shortCode: { type: 'string', required: false },
			accountType: { type: 'string', required: true, defaultValue: 'plusone' },
			adminDeadlineDays: { type: 'number', required: true, defaultValue: 2 },
			adminDeadlineTime: { type: 'string', required: true, defaultValue: '17:00' },
			invitedById: { type: 'string', required: false },
			allowedPlusOnes: { type: 'number', required: true, defaultValue: 1 }
		}
	} as const,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			console.log(`\n============================================================`);
			console.log(`[AUTH] PASSWORD RESET REQUESTED`);
			console.log(`[AUTH] User: ${user.name} (${user.email})`);
			console.log(`[AUTH] Reset Link: ${url}`);
			console.log(`============================================================\n`);

			try {
				if (!env.RESEND_API_KEY) {
					console.warn('[AUTH] RESEND_API_KEY is not defined. Email dispatch skipped.');
					return;
				}
				const resend = new (await import('resend')).Resend(env.RESEND_API_KEY);
				const { data, error } = await resend.emails.send({
					from: env.RESEND_FROM!,
					to: user.email,
					subject: 'Reset your password for Gbookminton',
					html: `<p>Hi ${user.name},</p><p>Please reset your password by clicking <a href="${url}">this link</a>.</p>`
				});
				if (error) {
					console.error('[AUTH] Resend failed to send password reset email:', error);
				} else {
					console.log('[AUTH] Password reset email sent successfully via Resend:', data);
				}
			} catch (err) {
				console.error('[AUTH] Exception thrown while sending password reset email:', err);
			}
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			console.log(`\n============================================================`);
			console.log(`[AUTH] EMAIL VERIFICATION TRIGGERED`);
			console.log(`[AUTH] User: ${user.name} (${user.email})`);
			console.log(`[AUTH] Verification Link: ${url}`);
			console.log(`============================================================\n`);

			try {
				if (!env.RESEND_API_KEY) {
					console.warn('[AUTH] RESEND_API_KEY is not defined. Email dispatch skipped.');
					return;
				}
				const resend = new (await import('resend')).Resend(env.RESEND_API_KEY);
				const { data, error } = await resend.emails.send({
					from: env.RESEND_FROM!,
					to: user.email,
					subject: 'Verify your email address for Gbookminton',
					html: `<p>Hi ${user.name},</p><p>Please verify your email address by clicking <a href="${url}">this link</a>.</p>`
				});
				if (error) {
					console.error('[AUTH] Resend failed to send verification email:', error);
				} else {
					console.log('[AUTH] Verification email sent successfully via Resend:', data);
				}
			} catch (err) {
				console.error('[AUTH] Exception thrown while sending verification email:', err);
			}
		}
	},
	databaseHooks: {
		user: {
			create: {
				before: async (userData) => {
					// Generate a secure, recognizable 6-character shortcode
					const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
					let code = '';
					for (let i = 0; i < 6; i++) {
						code += chars.charAt(Math.floor(Math.random() * chars.length));
					}

					// Determine account type based on email domain
					const email = userData.email || '';
					const emailDomain = email.split('@')[1]?.toLowerCase() || '';
					// Default to plusone, will be updated after companyDomain table is set up
					let accountType = 'plusone';

					// Check if email domain matches any company domain
					try {
						const domains = await db
							.select({ domain: schema.companyDomain.domain })
							.from(schema.companyDomain);
						for (const { domain } of domains) {
							if (domain.toLowerCase() === emailDomain) {
								accountType = 'company';
								break;
							}
						}
					} catch {
						// If table doesn't exist yet, use default
					}

					return {
						data: {
							...userData,
							shortCode: code,
							balance: 0,
							role: 'user',
							accountType,
							adminDeadlineDays: 2,
							adminDeadlineTime: '17:00'
						}
					};
				}
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
