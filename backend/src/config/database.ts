import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '@/config/env.js';
import * as enums from '@/db/schema/enums.js';
import * as userSchema from '@/db/schema/user.table.js';
import * as familySchema from '@/db/schema/family.table.js';
import * as familyMemberSchema from '@/db/schema/family-member.table.js';
import * as mealSchema from '@/db/schema/meal.table.js';
import * as proposalSchema from '@/db/schema/proposal.table.js';
import * as voteSchema from '@/db/schema/vote.table.js';

const schema = {
  ...enums,
  ...userSchema,
  ...familySchema,
  ...familyMemberSchema,
  ...mealSchema,
  ...proposalSchema,
  ...voteSchema,
};
/**
 * PostgreSQL connection instance
 */
export const connection = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle ORM database instance
 * Use this for all database operations
 */
export const db = drizzle(connection, { schema });

/**
 * Gracefully close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  await connection.end();
};
