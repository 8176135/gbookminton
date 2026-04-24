import { db } from './src/lib/server/db';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

console.log('Running migrations...');

try {
  migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
  console.log('Migrations completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Error running migrations:', error);
  process.exit(1);
}
