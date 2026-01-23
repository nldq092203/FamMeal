import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigration = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🏃 Running migrations...');

  const connection = postgres(databaseUrl, { max: 1 });
  const db = drizzle(connection);

  await migrate(db, { migrationsFolder: './drizzle' });

  await connection.end();

  console.log('✅ Migrations completed successfully');
};

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
