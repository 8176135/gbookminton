#!/usr/bin/env bun

import { db } from '../src/lib/server/db';
import { user, account } from '../src/lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

// Setup basic command line options
const args = process.argv.slice(2);
const cliEmail = args[0];
const cliPassword = args[1];

function prompt(query: string): Promise<string> {
	const rl = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve) => {
		rl.question(query, (answer: string) => {
			rl.close();
			resolve(answer);
		});
	});
}

function generateRandomPassword(length = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
	let pass = '';
	for (let i = 0; i < length; i++) {
		pass += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return pass;
}

async function main() {
	console.log('='.repeat(60));
	console.log('🔑  Gbookminton Local Password Override / Reset Tool 🔑');
	console.log('='.repeat(60));
	console.log();

	let selectedUser: typeof user.$inferSelect | null = null;
	let newPassword = '';

	if (cliEmail) {
		// CLI Argument mode
		console.log(`Searching for user with email: ${cliEmail}...`);
		const foundUsers = await db.select().from(user).where(eq(user.email, cliEmail)).limit(1);
		if (foundUsers.length === 0) {
			console.error(`❌ Error: User with email "${cliEmail}" not found in database.`);
			process.exit(1);
		}
		selectedUser = foundUsers[0];
		newPassword = cliPassword || generateRandomPassword();
	} else {
		// Interactive mode
		const allUsers = await db.select().from(user);
		if (allUsers.length === 0) {
			console.error('❌ Error: No users found in the database.');
			process.exit(1);
		}

		console.log('Existing Users:');
		allUsers.forEach((u, i) => {
			console.log(`  [${i + 1}] ${u.name} (${u.email}) - Role: ${u.role}`);
		});
		console.log();

		const selectionInput = await prompt(
			'Select a user by number [1-' + allUsers.length + '] or enter their email: '
		);
		console.log();

		const selectionNum = parseInt(selectionInput, 10);
		if (!isNaN(selectionNum) && selectionNum >= 1 && selectionNum <= allUsers.length) {
			selectedUser = allUsers[selectionNum - 1];
		} else {
			const emailInput = selectionInput.trim();
			const foundUsers = await db.select().from(user).where(eq(user.email, emailInput)).limit(1);
			if (foundUsers.length > 0) {
				selectedUser = foundUsers[0];
			}
		}

		if (!selectedUser) {
			console.error('❌ Error: Invalid selection or email.');
			process.exit(1);
		}

		console.log(`Selected User: ${selectedUser.name} (${selectedUser.email})`);
		const passInput = await prompt(
			'Enter new password (or press [Enter] to generate a secure random one): '
		);
		console.log();

		newPassword = passInput || generateRandomPassword();
	}

	console.log(`🔄 Resetting password for ${selectedUser.name} (${selectedUser.email})...`);

	// Hash password using BetterAuth crypto
	const hashedPassword = await hashPassword(newPassword);

	// Check if a credential account already exists
	const existingAccounts = await db
		.select()
		.from(account)
		.where(and(eq(account.userId, selectedUser.id), eq(account.providerId, 'credential')))
		.limit(1);

	const now = new Date();

	if (existingAccounts.length > 0) {
		// Update password
		await db
			.update(account)
			.set({
				password: hashedPassword,
				updatedAt: now
			})
			.where(eq(account.id, existingAccounts[0].id));
		console.log('✓ Account credentials updated successfully.');
	} else {
		// Create new credential account record
		const newAccountId = crypto.randomUUID();
		await db.insert(account).values({
			id: newAccountId,
			userId: selectedUser.id,
			accountId: selectedUser.email,
			providerId: 'credential',
			password: hashedPassword,
			createdAt: now,
			updatedAt: now
		});
		console.log('✓ Credential account created and password set successfully.');
	}

	console.log();
	console.log('='.repeat(60));
	console.log('🎉 SUCCESS! Password has been updated.');
	console.log(`👤 User:     ${selectedUser.name} (${selectedUser.email})`);
	console.log(`🔑 Password: ${newPassword}`);
	console.log('='.repeat(60));
	console.log();
}

main().catch((err) => {
	console.error('❌ Error processing password reset:', err);
	process.exit(1);
});
