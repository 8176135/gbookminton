import Database from 'better-sqlite3';

console.log('Running database migration: migrating isPrivate to visibility...');
const sqlite = new Database(process.env.DATABASE_PATH || 'local.db');

try {
	// 1. Check if visibility column already exists in the event table
	const tableInfo = sqlite.prepare('PRAGMA table_info(event)').all() as any[];
	const hasVisibility = tableInfo.some((col) => col.name === 'visibility');
	const hasIsPrivate = tableInfo.some((col) => col.name === 'isPrivate');

	if (!hasVisibility) {
		console.log("Adding column 'visibility' to 'event' table...");
		sqlite.prepare("ALTER TABLE event ADD COLUMN visibility TEXT NOT NULL DEFAULT 'onlyCompany'").run();
		console.log("✅ Added column 'visibility' to 'event'");

		// 2. Migrate existing data if both columns exist
		if (hasIsPrivate) {
			console.log('Migrating existing event data from isPrivate to visibility...');

			// Map isPrivate = 1 -> 'private'
			const privateCount = sqlite.prepare(
				"UPDATE event SET visibility = 'private' WHERE isPrivate = 1"
			).run();
			console.log(`✅ Updated ${privateCount.changes} private event(s)`);

			// Map isPrivate = 0 -> 'onlyCompany'
			const otherCount = sqlite.prepare(
				"UPDATE event SET visibility = 'onlyCompany' WHERE isPrivate = 0"
			).run();
			console.log(`✅ Updated ${otherCount.changes} public/company-only event(s)`);
		}
	} else {
		console.log("✓ Column 'visibility' already exists in 'event', skipping creation.");
	}

	// 3. Drop isPrivate column if it still exists
	if (hasIsPrivate) {
		console.log("Dropping obsolete column 'isPrivate' from 'event' table...");
		sqlite.prepare('ALTER TABLE event DROP COLUMN isPrivate').run();
		console.log("✅ Dropped column 'isPrivate' from 'event'");
	} else {
		console.log("✓ Column 'isPrivate' does not exist in 'event', skipping drop.");
	}

	console.log('🎉 Migration successful!');
} catch (e: any) {
	console.error('❌ Migration failed:', e.message);
} finally {
	sqlite.close();
}