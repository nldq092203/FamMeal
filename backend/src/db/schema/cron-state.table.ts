import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Cron state — one row per job
 */
export const cronState = pgTable('cron_state', {
  jobName: text('job_name').primaryKey(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CronState = InferSelectModel<typeof cronState>;
export type NewCronState = InferInsertModel<typeof cronState>;

