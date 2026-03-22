import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

const sqlite = new Database('local.db');
const db = drizzle(sqlite);

await migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
console.log('Migrations complete!');
