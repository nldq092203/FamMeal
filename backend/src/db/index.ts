/**
 * Database module
 * Re-exports database instance and utilities
 */
export { db, connection, closeDatabase } from '@/config/database.js';

// Export all schemas
export * from '@/db/schema/enums.js';
export * from '@/db/schema/user.table.js';
export * from '@/db/schema/family.table.js';
export * from '@/db/schema/family-member.table.js';
export * from '@/db/schema/meal.table.js';
export * from '@/db/schema/proposal.table.js';
export * from '@/db/schema/vote.table.js';
