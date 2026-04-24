import { Database } from 'bun:sqlite';

console.log('Patching local.db with missing columns...');
const sqlite = new Database('local.db');

const columnsToAdd = [
	// Updates to the user table
	{ table: 'user', column: 'accountType', def: "TEXT NOT NULL DEFAULT 'plusone'" },
	{ table: 'user', column: 'role', def: "TEXT NOT NULL DEFAULT 'user'" },
	{ table: 'user', column: 'balance', def: 'INTEGER NOT NULL DEFAULT 0' },
	{ table: 'user', column: 'shortCode', def: "TEXT DEFAULT ''" }, // Adding as standard text initially

	// Updates to the event table
	{ table: 'event', column: 'costCompany', def: 'INTEGER NOT NULL DEFAULT 0' },
	{ table: 'event', column: 'costPlusOne', def: 'INTEGER NOT NULL DEFAULT 0' },
	{ table: 'event', column: 'isLocked', def: 'INTEGER NOT NULL DEFAULT 0' },
	{ table: 'event', column: 'isPrivate', def: 'INTEGER NOT NULL DEFAULT 0' },
	{ table: 'event', column: 'capacity', def: 'INTEGER NOT NULL DEFAULT 16' }, // Common defaults
	{ table: 'event', column: 'description', def: "TEXT NOT NULL DEFAULT ''" }
];

// 1. Create completely missing tables if they don't exist
const tablesToCreate = [
	{
		name: 'companyDomain',
		sql: `CREATE TABLE IF NOT EXISTS companyDomain (
			id TEXT PRIMARY KEY,
			domain TEXT NOT NULL UNIQUE,
			createdAt INTEGER NOT NULL
		)`
	},
	{
		name: 'transaction',
		sql: `CREATE TABLE IF NOT EXISTS "transaction" (
			id TEXT PRIMARY KEY,
			userId TEXT NOT NULL,
			amount INTEGER NOT NULL,
			reference TEXT NOT NULL,
			type TEXT NOT NULL,
			date INTEGER NOT NULL,
			FOREIGN KEY(userId) REFERENCES user(id)
		)`
	},
	{
		name: 'eventSignup',
		sql: `CREATE TABLE IF NOT EXISTS eventSignup (
			id TEXT PRIMARY KEY,
			userId TEXT NOT NULL,
			eventId TEXT NOT NULL,
			status TEXT NOT NULL,
			createdAt INTEGER NOT NULL,
			FOREIGN KEY(userId) REFERENCES user(id),
			FOREIGN KEY(eventId) REFERENCES event(id)
		)`
	}
];

for (const { name, sql } of tablesToCreate) {
	try {
		sqlite.run(sql);
		console.log(`✅ Ensured table '${name}' exists.`);
	} catch (e: any) {
		console.error(`❌ Error creating table '${name}':`, e.message);
	}
}

// 2. Add missing columns to existing tables
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

sqlite.close();
console.log('\nPatching complete! You can now run `bun run dev` securely.');
