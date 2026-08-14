import { db } from '../src/lib/server/db';
import { user, balanceTransaction } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Setup basic command line options
const args = process.argv.slice(2);
const cliEmail = args[0];
const cliAmountStr = args[1];
const cliNotes = args[2];

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

async function main() {
	console.log('='.repeat(60));
	console.log('💰  Gbookminton Local Balance Credit Tool 💰');
	console.log('='.repeat(60));
	console.log();

	let selectedUser: typeof user.$inferSelect | null = null;
	let amountCents = 0;
	let notes = 'Manual balance adjustment by admin';

	if (cliEmail) {
		// CLI Argument mode
		console.log(`Searching for user with email: ${cliEmail}...`);
		const foundUsers = await db.select().from(user).where(eq(user.email, cliEmail)).limit(1);
		if (foundUsers.length === 0) {
			console.error(`❌ Error: User with email "${cliEmail}" not found in database.`);
			process.exit(1);
		}
		selectedUser = foundUsers[0];

		if (!cliAmountStr) {
			console.error('❌ Error: Amount in dollars must be provided as the second argument.');
			process.exit(1);
		}

		const parsedAmount = parseFloat(cliAmountStr);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			console.error('❌ Error: Invalid amount. Must be a positive number.');
			process.exit(1);
		}
		amountCents = Math.round(parsedAmount * 100);
		notes = cliNotes || 'Manual balance adjustment by admin';
	} else {
		// Interactive mode
		const allUsers = await db.select().from(user);
		if (allUsers.length === 0) {
			console.error('❌ Error: No users found in the database.');
			process.exit(1);
		}

		console.log('Existing Users & Balances:');
		allUsers.forEach((u, i) => {
			const formattedBal = (u.balance / 100).toFixed(2);
			console.log(`  [${i + 1}] ${u.name} (${u.email}) - Current Balance: $${formattedBal}`);
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

		const currentFormatted = (selectedUser.balance / 100).toFixed(2);
		console.log(
			`Selected User: ${selectedUser.name} (${selectedUser.email}) [Current: $${currentFormatted}]`
		);

		const amountInput = await prompt('Enter amount in dollars to add (e.g. 10.50): ');
		const parsedAmount = parseFloat(amountInput);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			console.error('❌ Error: Invalid amount. Must be a positive number.');
			process.exit(1);
		}
		amountCents = Math.round(parsedAmount * 100);

		console.log();
		const notesInput = await prompt(
			'Enter custom transaction notes (press [Enter] for default: "Manual balance adjustment by admin"): '
		);
		notes = notesInput.trim() || 'Manual balance adjustment by admin';
		console.log();
	}

	const oldBalance = selectedUser.balance;
	const newBalance = oldBalance + amountCents;

	console.log(
		`🔄 Crediting $${(amountCents / 100).toFixed(2)} to ${selectedUser.name}'s account...`
	);

	await db.transaction(async (tx) => {
		// Update user balance
		await tx
			.update(user)
			.set({
				balance: newBalance,
				updatedAt: new Date()
			})
			.where(eq(user.id, selectedUser!.id));

		// Insert Transaction Record
		await tx.insert(balanceTransaction).values({
			id: crypto.randomUUID(),
			userId: selectedUser!.id,
			amount: amountCents,
			reference: 'manual',
			type: 'manual_adjustment',
			notes: notes,
			date: new Date()
		});
	});

	console.log();
	console.log('='.repeat(60));
	console.log('🎉 SUCCESS! Balance credited and audited.');
	console.log(`👤 User:         ${selectedUser.name} (${selectedUser.email})`);
	console.log(`💵 Added:        +$${(amountCents / 100).toFixed(2)}`);
	console.log(`💰 New Balance:  $${(newBalance / 100).toFixed(2)}`);
	console.log(`📝 Notes:        "${notes}"`);
	console.log('='.repeat(60));
	console.log();
}

main().catch((err) => {
	console.error('❌ Error processing balance credit:', err);
	process.exit(1);
});
