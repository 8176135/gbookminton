import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { Database } from 'bun:sqlite';

const sqlite = new Database(process.env.DATABASE_PATH || './data/local.db');
export const db = drizzle(sqlite, { schema });
