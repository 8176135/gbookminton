import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/local.db';

// Ensure the parent directory exists so SQLite doesn't crash when opening the database
const dir = dirname(dbPath);
if (dir && dir !== '.' && !existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
