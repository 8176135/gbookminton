import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DATABASE_PATH || 'local.db';
const dbDir = dirname(dbPath);
if (dbDir && dbDir !== '.' && !existsSync(dbDir)) {
	mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const hasMigrationsTable = sqlite
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'")
	.get();
const tableCount = (
	sqlite
		.prepare(
			"SELECT count(*) AS c FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
		)
		.get() as { c: number }
).c;

if (!hasMigrationsTable && tableCount > 0) {
	console.warn(
		'Existing database detected without a Drizzle migration journal (likely created via db:push/patch). ' +
			'Skipping journal migrations. Changelog table and audit triggers will still be ensured.'
	);
} else {
	await migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
	console.log('Migrations complete!');
}

import { getTableColumns } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from './lib/server/db/schema';

console.log('Ensuring changelog table exists...');
sqlite.exec(`
	CREATE TABLE IF NOT EXISTS changelog (
		id TEXT PRIMARY KEY,
		tableName TEXT NOT NULL,
		recordId TEXT NOT NULL,
		action TEXT NOT NULL,
		oldData TEXT,
		newData TEXT,
		timestamp INTEGER NOT NULL
	);
`);

// Fields to exclude from auditing logs for security and privacy
const EXCLUDED_FIELDS: Record<string, string[]> = {
	account: ['password', 'accessToken', 'refreshToken', 'idToken'],
	user: [],
	event: []
};

function buildJsonObject(tableName: string, prefix: 'NEW' | 'OLD', columns: string[]) {
	const excluded = EXCLUDED_FIELDS[tableName] || [];
	const filtered = columns.filter(col => !excluded.includes(col));
	
	// SQLite's json_object requires alternating key-value arguments: 'colName', prefix."colName"
	const args = filtered.map(col => `'${col}', ${prefix}."${col}"`).join(', ');
	return `json_object(${args})`;
}

function setupTableAuditing(tableName: string, tableSchema: SQLiteTable) {
	const columns = Object.values(getTableColumns(tableSchema)).map(col => col.name);
	
	const newJson = buildJsonObject(tableName, 'NEW', columns);
	const oldJson = buildJsonObject(tableName, 'OLD', columns);
	
	console.log(`Setting up dynamic changelog triggers for table: ${tableName}`);
	
	// Drop old triggers to ensure they are recreated with the latest columns
	sqlite.exec(`DROP TRIGGER IF EXISTS "${tableName}_after_insert";`);
	sqlite.exec(`DROP TRIGGER IF EXISTS "${tableName}_after_update";`);
	sqlite.exec(`DROP TRIGGER IF EXISTS "${tableName}_after_delete";`);
	
	// 1. Insert Trigger
	sqlite.exec(`
		CREATE TRIGGER "${tableName}_after_insert"
		AFTER INSERT ON "${tableName}"
		BEGIN
			INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
			VALUES (
				hex(randomblob(16)),
				'${tableName}',
				NEW.id,
				'insert',
				NULL,
				${newJson},
				unixepoch() * 1000
			);
		END;
	`);

	// 2. Update Trigger
	sqlite.exec(`
		CREATE TRIGGER "${tableName}_after_update"
		AFTER UPDATE ON "${tableName}"
		BEGIN
			INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
			VALUES (
				hex(randomblob(16)),
				'${tableName}',
				OLD.id,
				'update',
				${oldJson},
				${newJson},
				unixepoch() * 1000
			);
		END;
	`);

	// 3. Delete Trigger
	sqlite.exec(`
		CREATE TRIGGER "${tableName}_after_delete"
		AFTER DELETE ON "${tableName}"
		BEGIN
			INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
			VALUES (
				hex(randomblob(16)),
				'${tableName}',
				OLD.id,
				'delete',
				${oldJson},
				NULL,
				unixepoch() * 1000
			);
		END;
	`);
}

// Automatically configure triggers for important tables
setupTableAuditing('user', schema.user);
setupTableAuditing('event', schema.event);
setupTableAuditing('account', schema.account);

console.log('Changelog triggers fully initialized!');