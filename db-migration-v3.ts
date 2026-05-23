import { Database } from 'bun:sqlite';

console.log('Running database migration v3...');
const sqlite = new Database('local.db');

// 1. Add new columns to existing tables
const columnsToAdd = [
	{ table: 'user', column: 'invitedById', def: 'TEXT' },
	{ table: 'user', column: 'allowedPlusOnes', def: 'INTEGER NOT NULL DEFAULT 1' },
	{ table: 'eventSignup', column: 'paidById', def: 'TEXT' }
];

for (const { table, column, def } of columnsToAdd) {
	try {
		sqlite.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
		console.log(`✅ Added column '${column}' to '${table}'`);
	} catch (e: any) {
		if (e.message.includes('duplicate column')) {
			console.log(`✓ Column '${column}' already exists in '${table}', skipping.`);
		} else {
			console.error(`❌ Error adding '${column}' to '${table}':`, e.message);
		}
	}
}

// 2. Perform data migration
try {
	// Find first admin
	const admins = sqlite
		.query("SELECT id, name, email, accountType FROM user WHERE role = 'admin'")
		.all() as any[];

	if (admins.length === 0) {
		console.log('⚠️ No admin users found in database to assign existing plus-ones to.');
	} else {
		// Pick the first admin
		const defaultAdmin = admins.find((a) => a.accountType === 'company') || admins[0];
		console.log(
			`👑 Selected admin '${defaultAdmin.name}' (ID: ${defaultAdmin.id}) as the default inviter for existing plus-ones.`
		);

		// Set default admin allowedPlusOnes to 999999 (infinite invites) and accountType to company
		sqlite.run("UPDATE user SET allowedPlusOnes = 999999, accountType = 'company' WHERE id = ?", [
			defaultAdmin.id
		]);
		console.log(
			`✅ Updated admin '${defaultAdmin.name}' invite limit to 999999 and accountType to 'company'.`
		);

		// Find existing plusone users without an inviter
		const uninvitedPlusones = sqlite
			.query(
				"SELECT id, name, email FROM user WHERE accountType = 'plusone' AND (invitedById IS NULL OR invitedById = '')"
			)
			.all() as any[];

		console.log(
			`🔍 Found ${uninvitedPlusones.length} existing plus-one user(s) without an inviter.`
		);

		for (const p of uninvitedPlusones) {
			// Exclude assigning an admin to themselves
			if (p.id === defaultAdmin.id) continue;

			sqlite.run('UPDATE user SET invitedById = ? WHERE id = ?', [defaultAdmin.id, p.id]);
			console.log(
				`🤝 Assigned existing plus-one '${p.name}' (${p.email}) to inviter '${defaultAdmin.name}'.`
			);
		}
	}
} catch (e: any) {
	console.error('❌ Data migration error:', e.message);
}

sqlite.close();
console.log('🎉 Migration v3 complete!');
