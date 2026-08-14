/**
 * Interactive demo-data seeder for Gbookminton.
 *
 * On a fresh (or reset) database this creates:
 *   - An admin account + a set of Company / Plus One member accounts
 *   - A handful of events (some in the past, some upcoming)
 *   - A recurring weekly event series spanning a couple of weeks
 *   - Signups on events, with balance deductions + audit transactions recorded
 *     the same way the real deadline processor would for past events
 *
 * Everything is prompted interactively with sensible defaults — pressing
 * [Enter] accepts the default shown in brackets.
 *
 * Usage:
 *   pnpm generate-test-events                # Interactive walk-through
 *   pnpm generate-test-events --yes          # Run with all defaults, no prompts
 *   pnpm generate-test-events --dry-run      # Print the plan, don't write anything
 *   pnpm generate-test-events --dry-run --yes
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/server/db';
import * as schema from '../src/lib/server/db/schema';

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const FLAG_YES = args.includes('--yes') || args.includes('-y');
const FLAG_DRY_RUN = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Interactive prompt helpers (readline/promises)
// ---------------------------------------------------------------------------

const rl = createInterface({ input, output });

async function askText(question: string, defaultValue?: string): Promise<string> {
	const suffix = defaultValue !== undefined ? ` [${defaultValue}]` : '';
	const answer = (await rl.question(`  ${question}${suffix}: `)).trim();
	return answer || (defaultValue as string) || '';
}

async function askNumber(
	question: string,
	defaultValue: number,
	min = 0,
	max = Number.MAX_SAFE_INTEGER
): Promise<number> {
	for (;;) {
		const raw = await askText(question, String(defaultValue));
		const n = parseInt(raw, 10);
		if (!Number.isNaN(n) && n >= min && n <= max) return n;
		console.log(`    Please enter a whole number between ${min} and ${max}.`);
	}
}

async function askConfirm(question: string, defaultYes = true): Promise<boolean> {
	const hint = defaultYes ? 'Y/n' : 'y/N';
	const answer = (await rl.question(`  ${question} [${hint}]: `)).trim().toLowerCase();
	if (answer === '') return defaultYes;
	return ['y', 'yes', '1'].includes(answer);
}

async function askSelect<T extends string>(
	question: string,
	options: T[],
	defaultValue: T
): Promise<T> {
	console.log(`  ${question}`);
	options.forEach((opt, i) => {
		console.log(`    [${i + 1}] ${opt}${opt === defaultValue ? '  (default)' : ''}`);
	});
	for (;;) {
		const raw = (await rl.question('    Choose: ')).trim().toLowerCase();
		if (raw === '') return defaultValue;
		const asNumber = parseInt(raw, 10);
		if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= options.length) {
			return options[asNumber - 1];
		}
		const match = options.find((o) => o.toLowerCase() === raw);
		if (match) return match;
		console.log('    Invalid choice, please try again.');
	}
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomShortCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
	return code;
}

function generateUniqueShortCodes(count: number): string[] {
	const seen = new Set<string>();
	const codes: string[] = [];
	while (codes.length < count) {
		const code = randomShortCode();
		if (!seen.has(code)) {
			seen.add(code);
			codes.push(code);
		}
	}
	return codes;
}

function dollarsToCents(dollars: number): number {
	return Math.round(dollars * 100);
}

function atHour(dayOffset: number, hour: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + dayOffset);
	d.setHours(hour, 0, 0, 0);
	return d;
}

function dayOffsets(count: number, baseDays: number, stepDays: number): number[] {
	return Array.from({ length: Math.max(0, count) }, (_, i) => baseDays + i * stepDays);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface SeedConfig {
	reset: boolean;
	adminName: string;
	adminEmail: string;
	adminPassword: string;
	companyDomain: string;
	companyUserCount: number;
	plusOneUserCount: number;
	userPassword: string;
	startingBalanceCents: number;
	pastCount: number;
	upcomingCount: number;
	weeklyRecurrences: number;
	capacity: number;
	durationMinutes: number;
	deadlineHoursBefore: number;
	costCompanyCents: number;
	costPlusOneCents: number;
	visibility: 'private' | 'onlyCompany' | 'public';
	createSignups: boolean;
	signupsPerEvent: number; // 0 => every non-admin member
}

const DEFAULTS: SeedConfig = {
	reset: true,
	adminName: 'Alex Morgan',
	adminEmail: 'admin@example.com',
	adminPassword: 'password123',
	companyDomain: 'example.com',
	companyUserCount: 3,
	plusOneUserCount: 3,
	userPassword: 'password123',
	startingBalanceCents: dollarsToCents(100),
	pastCount: 2,
	upcomingCount: 2,
	weeklyRecurrences: 3,
	capacity: 24,
	durationMinutes: 90,
	deadlineHoursBefore: 24,
	costCompanyCents: dollarsToCents(15),
	costPlusOneCents: dollarsToCents(20),
	visibility: 'onlyCompany',
	createSignups: true,
	signupsPerEvent: 0
};

// ---------------------------------------------------------------------------
// Data generation
// ---------------------------------------------------------------------------

const EVENT_POOL = [
	{ title: 'Mixed Doubles Night', loc: 'Community Centre Court 1' },
	{ title: 'Intermediate Training', loc: 'Sports Hall A' },
	{ title: 'Beginners Workshop', loc: 'Indoor Court 3' },
	{ title: 'Open Play Session', loc: 'Recreation Center' },
	{ title: 'Competitive Match Night', loc: 'Badminton Club' },
	{ title: 'Coaching Clinic', loc: 'Community Centre Court 2' }
];

const RECURRING_TITLE = 'Weekly Social Session';
const RECURRING_LOC = 'Community Centre Court 1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface SeedUser {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user';
	accountType: 'company' | 'plusone';
	shortCode: string;
}

interface SeedEvent {
	id: string;
	title: string;
	location: string;
	date: Date;
	duration: number;
	description: string;
	capacity: number;
	deadline: Date;
	costCompany: number;
	costPlusOne: number;
	visibility: 'private' | 'onlyCompany' | 'public';
	locked: boolean;
}

function makeEvent(cfg: SeedConfig, title: string, location: string, date: Date, locked: boolean): SeedEvent {
	const deadline = new Date(date.getTime() - cfg.deadlineHoursBefore * 60 * 60 * 1000);
	return {
		id: crypto.randomUUID(),
		title,
		location,
		date,
		duration: cfg.durationMinutes,
		description: `Demo ${title.toLowerCase()} — grab a spot and come play! All levels welcome, subs included.`,
		capacity: cfg.capacity,
		deadline,
		costCompany: cfg.costCompanyCents,
		costPlusOne: cfg.costPlusOneCents,
		visibility: cfg.visibility,
		locked
	};
}

function buildEvents(cfg: SeedConfig): SeedEvent[] {
	const events: SeedEvent[] = [];

	for (const offset of dayOffsets(cfg.pastCount, -2, -4)) {
		const tpl = randomItem(EVENT_POOL);
		events.push(makeEvent(cfg, tpl.title, tpl.loc, atHour(offset, 19), true));
	}
	for (const offset of dayOffsets(cfg.upcomingCount, 3, 3)) {
		const tpl = randomItem(EVENT_POOL);
		events.push(makeEvent(cfg, tpl.title, tpl.loc, atHour(offset, 19), false));
	}
	for (let i = 1; i <= cfg.weeklyRecurrences; i++) {
		const date = atHour(i * 7, 18);
		events.push(
			makeEvent(
				cfg,
				cfg.weeklyRecurrences > 1 ? `${RECURRING_TITLE} #${i}` : RECURRING_TITLE,
				RECURRING_LOC,
				date,
				false
			)
		);
	}

	return events;
}

function buildUsers(cfg: SeedConfig): SeedUser[] {
	const codes = generateUniqueShortCodes(1 + cfg.companyUserCount + cfg.plusOneUserCount);
	const users: SeedUser[] = [];
	let codeIdx = 0;

	users.push({
		id: crypto.randomUUID(),
		name: cfg.adminName,
		email: cfg.adminEmail,
		role: 'admin',
		accountType: 'company',
		shortCode: codes[codeIdx++]
	});

	for (let i = 1; i <= cfg.companyUserCount; i++) {
		users.push({
			id: crypto.randomUUID(),
			name: `Company Member ${i}`,
			email: `company${i}@${cfg.companyDomain}`,
			role: 'user',
			accountType: 'company',
			shortCode: codes[codeIdx++]
		});
	}

	for (let i = 1; i <= cfg.plusOneUserCount; i++) {
		users.push({
			id: crypto.randomUUID(),
			name: `Guest Member ${i}`,
			email: `guest${i}@outlook.com`,
			role: 'user',
			accountType: 'plusone',
			shortCode: codes[codeIdx++]
		});
	}

	return users;
}

// ---------------------------------------------------------------------------
// Database writes
// ---------------------------------------------------------------------------

function clearExistingData(): void {
	db.transaction((tx) => {
		tx.delete(schema.balanceTransaction).run();
		tx.delete(schema.eventSignup).run();
		tx.delete(schema.event).run();
		tx.delete(schema.session).run();
		tx.delete(schema.account).run();
		tx.delete(schema.verification).run();
		tx.delete(schema.user).run();
		tx.delete(schema.companyDomain).run();
	});
}

async function seedDemo(cfg: SeedConfig): Promise<void> {
	const users = buildUsers(cfg);
	const events = buildEvents(cfg);

	const signupUsers = users.filter((u) => u.role !== 'admin');
	const perEvent = cfg.signupsPerEvent > 0 ? cfg.signupsPerEvent : signupUsers.length;
	const balances = new Map<string, number>(users.map((u) => [u.id, cfg.startingBalanceCents]));

	// Hash passwords up-front — the SQLite transaction below must be synchronous,
	// so no async work is allowed inside it.
	const adminHash = await hashPassword(cfg.adminPassword);
	const userHash = await hashPassword(cfg.userPassword);
	const now = new Date();

	db.transaction((tx) => {
		// Company domain
		tx.insert(schema.companyDomain)
			.values({ id: crypto.randomUUID(), domain: cfg.companyDomain, createdAt: now })
			.run();

		// Users + credential accounts (admin has its own password, members share one)
		for (const u of users) {
			tx.insert(schema.user)
				.values({
					id: u.id,
					name: u.name,
					email: u.email,
					emailVerified: true,
					createdAt: now,
					updatedAt: now,
					balance: cfg.startingBalanceCents,
					shortCode: u.shortCode,
					role: u.role,
					accountType: u.accountType,
					invitedById: null,
					allowedPlusOnes: 1
				})
				.run();
			tx.insert(schema.account)
				.values({
					id: crypto.randomUUID(),
					userId: u.id,
					accountId: u.email,
					providerId: 'credential',
					password: u.role === 'admin' ? adminHash : userHash,
					createdAt: now,
					updatedAt: now
				})
				.run();
		}

		// Events + signups
		for (const ev of events) {
			tx.insert(schema.event)
				.values({
					id: ev.id,
					title: ev.title,
					date: ev.date,
					location: ev.location,
					duration: ev.duration,
					description: ev.description,
					capacity: ev.capacity,
					deadline: ev.deadline,
					costCompany: ev.costCompany,
					costPlusOne: ev.costPlusOne,
					isLocked: ev.locked,
					visibility: ev.visibility,
					createdAt: now,
					updatedAt: now
				})
				.run();

			if (cfg.createSignups) {
				for (const su of signupUsers.slice(0, perEvent)) {
					const signupId = crypto.randomUUID();
					tx.insert(schema.eventSignup)
						.values({
							id: signupId,
							userId: su.id,
							eventId: ev.id,
							status: ev.locked ? 'locked' : 'listed',
							createdAt: now
						})
						.run();

					if (ev.locked) {
						const cost = su.accountType === 'company' ? ev.costCompany : ev.costPlusOne;
						const prior = balances.get(su.id) ?? 0;
						balances.set(su.id, prior - cost);

						tx.insert(schema.balanceTransaction)
							.values({
								id: crypto.randomUUID(),
								userId: su.id,
								amount: -cost,
								reference: ev.id,
								type: 'signup_deduction',
								eventSignupId: signupId,
								notes: `Signup for ${ev.title}`,
								date: new Date(ev.date.getTime() - DAY_MS)
							})
							.run();
					}
				}
			}
		}

		// Apply updated balances
		for (const [userId, balance] of balances) {
			tx.update(schema.user)
				.set({ balance, updatedAt: now })
				.where(eq(schema.user.id, userId))
				.run();
		}
	});
}

// ---------------------------------------------------------------------------
// Plan preview (dry run)
// ---------------------------------------------------------------------------

async function printPlan(cfg: SeedConfig): Promise<void> {
	const users = buildUsers(cfg);
	const events = buildEvents(cfg);
	const signupUsers = users.filter((u) => u.role !== 'admin');
	const perEvent = cfg.signupsPerEvent > 0 ? cfg.signupsPerEvent : signupUsers.length;

	console.log('  Accounts:');
	for (const u of users) {
		console.log(
			`    - ${u.name.padEnd(20)} ${u.email.padEnd(32)} (${u.accountType}, ${u.role}${
				u.role === 'admin' ? `, pw: ${cfg.adminPassword}` : ''
			})`
		);
	}
	console.log(`    All ${u_name_count(users)} use password: ${cfg.userPassword}`);
	console.log(`    Starting balance: $${(cfg.startingBalanceCents / 100).toFixed(2)}`);

	console.log('\n  Events:');
	for (const ev of events) {
		console.log(
			`    - ${ev.title.padEnd(24)} ${ev.date.toISOString()}  ${ev.locked ? 'LOCKED' : 'open'}`
		);
	}
	console.log(`    Signups per event: ${Math.min(perEvent, signupUsers.length)}`);
}

function u_name_count(users: SeedUser[]): number {
	return users.filter((u) => u.role !== 'admin').length;
}

// ---------------------------------------------------------------------------
// Interactive configuration
// ---------------------------------------------------------------------------

async function configure(): Promise<SeedConfig> {
	const cfg: SeedConfig = { ...DEFAULTS };

	console.log('\n── Accounts ────────────────────────────────────────────────');

	cfg.reset = await askConfirm('Reset (wipe) existing demo data first?', DEFAULTS.reset);
	cfg.adminName = await askText('Admin name', DEFAULTS.adminName);
	cfg.adminEmail = await askText('Admin email', DEFAULTS.adminEmail);
	cfg.adminPassword = await askText('Admin password', DEFAULTS.adminPassword);
	cfg.companyDomain = await askText('Company email domain', DEFAULTS.companyDomain);
	cfg.companyUserCount = await askNumber('Number of Company members', DEFAULTS.companyUserCount, 0, 50);
	cfg.plusOneUserCount = await askNumber('Number of Plus One / guest members', DEFAULTS.plusOneUserCount, 0, 50);
	cfg.userPassword = await askText('Shared password for all members', DEFAULTS.userPassword);
	const startingBalance = await askNumber(
		`Starting balance per member ($)`,
		DEFAULTS.startingBalanceCents / 100,
		0,
		100000
	);
	cfg.startingBalanceCents = dollarsToCents(startingBalance);

	console.log('\n── Events ─────────────────────────────────────────────────');

	cfg.pastCount = await askNumber('Past (already played) events', DEFAULTS.pastCount, 0, 20);
	cfg.upcomingCount = await askNumber('Upcoming one-off events', DEFAULTS.upcomingCount, 0, 20);
	cfg.weeklyRecurrences = await askNumber(
		'Weekly recurring sessions (weekly for N weeks)',
		DEFAULTS.weeklyRecurrences,
		0,
		12
	);
	cfg.capacity = await askNumber('Event capacity', DEFAULTS.capacity, 1, 500);
	cfg.durationMinutes = await askNumber('Event duration (minutes)', DEFAULTS.durationMinutes, 15, 600);
	cfg.deadlineHoursBefore = await askNumber(
		'Signup deadline (hours before event)',
		DEFAULTS.deadlineHoursBefore,
		0,
		24 * 30
	);
	const costCompany = await askNumber(`Cost for Company members ($)`, DEFAULTS.costCompanyCents / 100, 0, 1000);
	const costPlusOne = await askNumber(`Cost for Plus One members ($)`, DEFAULTS.costPlusOneCents / 100, 0, 1000);
	cfg.costCompanyCents = dollarsToCents(costCompany);
	cfg.costPlusOneCents = dollarsToCents(costPlusOne);
	cfg.visibility = await askSelect(
		'Event visibility',
		['onlyCompany', 'public', 'private'] as const,
		DEFAULTS.visibility
	);

	console.log('\n── Signups ────────────────────────────────────────────────');

	cfg.createSignups = await askConfirm('Create signups on events?', DEFAULTS.createSignups);
	if (cfg.createSignups) {
		cfg.signupsPerEvent = await askNumber(
			'Signups per event (0 = every member)',
			DEFAULTS.signupsPerEvent,
			0,
			200
		);
	}

	return cfg;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	console.log('='.repeat(64));
	console.log('  Gbookminton Demo Data Seeder');
	console.log('  Creates demo accounts, events, and signups for a fresh database');
	console.log('='.repeat(64));

	const cfg = FLAG_YES ? { ...DEFAULTS } : await configure();

	console.log('\n' + '='.repeat(64));
	console.log('  Plan preview');
	console.log('='.repeat(64));
	await printPlan(cfg);

	if (cfg.reset && !FLAG_DRY_RUN) {
		console.log('\n  Reset: existing data will be wiped first.');
	}

	console.log('\n' + '='.repeat(64));

	if (FLAG_DRY_RUN) {
		console.log('\n[DRY RUN] Nothing was written. Run without --dry-run to apply.\n');
		return;
	}

	if (!FLAG_YES) {
		const ok = await askConfirm('\nApply this demo data?', true);
		if (!ok) {
			console.log('\nAborted. Nothing was written.\n');
			return;
		}
	}

	if (cfg.reset) {
		console.log('\n  Clearing existing data...');
		await clearExistingData();
	}

	console.log('\n  Seeding database...');
	const startedAt = Date.now();
	await seedDemo(cfg);

	const userCount = 1 + cfg.companyUserCount + cfg.plusOneUserCount;
	const eventCount = cfg.pastCount + cfg.upcomingCount + cfg.weeklyRecurrences;
	const signupUsers = Math.max(0, userCount - 1);
	const perEvent = cfg.signupsPerEvent > 0 ? cfg.signupsPerEvent : signupUsers;
	const signupCount = cfg.createSignups ? eventCount * Math.min(perEvent, signupUsers) : 0;

	console.log('\n' + '='.repeat(64));
	console.log(`  Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
	console.log('='.repeat(64));
	console.log(`  Admin login:   ${cfg.adminEmail}  /  ${cfg.adminPassword}`);
	console.log(`  Members:       ${userCount - 1} accounts, password: ${cfg.userPassword}`);
	console.log(`  Company domain: ${cfg.companyDomain}`);
	console.log(`  Events:        ${eventCount}  (${cfg.pastCount} past, ${cfg.upcomingCount} upcoming, ${cfg.weeklyRecurrences} weekly)`);
	console.log(`  Signups:       ${signupCount}`);
	console.log('='.repeat(64));
	console.log();
}

main()
	.catch((err) => {
		console.error('\n❌ Seeding failed:', err);
		process.exitCode = 1;
	})
	.finally(() => {
		rl.close();
	});
