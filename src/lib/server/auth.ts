import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification
        }
    }),
    user: {
        additionalFields: {
            role: { type: "string", required: true, defaultValue: "user" },
            balance: { type: "number", required: true, defaultValue: 0 },
            shortCode: { type: "string", required: false }
        }
    } as const,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const resend = new (await import('resend')).Resend(env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'Gookminton <noreply@gookminton.com>',
                to: user.email,
                subject: 'Verify your email address for Gookminton',
                html: `<p>Hi ${user.name},</p><p>Please verify your email address by clicking <a href="${url}">this link</a>.</p>`
            });
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Generate a secure, recognizable 6-character shortcode 
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let code = '';
                    for (let i = 0; i < 6; i++) {
                        code += chars.charAt(Math.floor(Math.random() * chars.length));
                    }

                    return {
                        data: {
                            ...user,
                            shortCode: code,
                            balance: 0,
                            role: 'user'
                        }
                    };
                }
            }
        }
    }
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
