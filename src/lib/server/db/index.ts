import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { Database } from 'bun:sqlite';

const sqlite = new Database(process.env.DATABASE_PATH || 'local.db');
export const db = drizzle(sqlite, { schema });
