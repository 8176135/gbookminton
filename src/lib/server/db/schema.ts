import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
    image: text('image'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),

    // App customized fields
    balance: integer('balance').notNull().default(0), // in cents
    shortCode: text('shortCode').notNull().unique(),
    role: text('role').notNull().default('user')
});

export const session = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => user.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
    refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }),
    updatedAt: integer('updatedAt', { mode: 'timestamp' })
});

export const event = sqliteTable("event", {
    id: text("id").primaryKey(),
    title: text('title').notNull(),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    location: text('location').notNull(),
    duration: integer('duration').notNull(), // in minutes
    description: text('description').notNull(),
    capacity: integer('capacity').notNull(),
    deadline: integer('deadline', { mode: 'timestamp' }).notNull(),
    cost: integer('cost').notNull().default(0), // in cents
    isLocked: integer('isLocked', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const eventSignup = sqliteTable("eventSignup", {
    id: text("id").primaryKey(),
    userId: text('userId').notNull().references(() => user.id),
    eventId: text('eventId').notNull().references(() => event.id),
    status: text('status').notNull(), // 'listed', 'waitlist', 'locked', 'withdrawn', 'removed'
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
});

export const transaction = sqliteTable("transaction", {
    id: text("id").primaryKey(),
    userId: text('userId').notNull().references(() => user.id),
    amount: integer('amount').notNull(), // positive for deposit, positive for deduction
    reference: text('reference').notNull(), // up bank reference or event id
    type: text('type').notNull(), // 'deposit' or 'deduction'
    date: integer('date', { mode: 'timestamp' }).notNull()
});
