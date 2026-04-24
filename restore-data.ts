import { Database } from 'bun:sqlite';

console.log('Attaching backup database...');
const sqlite = new Database('local.db');
sqlite.run("ATTACH DATABASE 'local.db.backup' AS backup");

const tables = [
	'user',
	'session',
	'account',
	'verification',
	'event',
	'eventSignup',
	'transaction',
	'companyDomain'
];

for (const table of tables) {
	try {
		// 1. Get column list from the new database
		const newColsQuery = sqlite.query(`PRAGMA table_info("${table}")`).all() as any[];
		if (newColsQuery.length === 0) continue; // Table doesn't exist
		const newCols = newColsQuery.map((c) => c.name);

		// 2. Get column list from the backup database
		const oldColsQuery = sqlite.query(`PRAGMA backup.table_info("${table}")`).all() as any[];
		if (oldColsQuery.length === 0) continue; // Table didn't exist in backup
		const oldCols = oldColsQuery.map((c) => c.name);

		// 3. Find intersection of columns
		const commonCols = newCols.filter((c) => oldCols.includes(c));
		const colStr = commonCols.map((c) => `"${c}"`).join(', ');

		// 4. Do the insert, quoting table names to avoid reserved keyword errors (e.g. transaction)
		if (commonCols.length > 0) {
			sqlite.run(`INSERT OR IGNORE INTO "${table}" (${colStr}) SELECT ${colStr} FROM backup."${table}"`);
			console.log(`✅ Restored data for table: ${table} (${commonCols.length} matching columns)`);
		}
	} catch (e: any) {
		console.error(`❌ Failed to restore ${table}:`, e.message);
	}
}

sqlite.close();
console.log('\nData restoration complete! You are fully migrated.');
