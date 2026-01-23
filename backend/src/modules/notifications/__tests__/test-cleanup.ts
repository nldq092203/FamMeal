import { afterAll, afterEach, beforeEach } from 'vitest';
import {
  TEST_IDS,
  cleanupNotificationTestData,
  seedNotificationTestData,
} from './db-fixtures';

export { TEST_IDS, cleanupNotificationTestData, seedNotificationTestData };

/**
 * Ensures no test data persists even if a test fails mid-suite.
 */
export function useNotificationTestDb(): void {
  beforeEach(async () => {
    await cleanupNotificationTestData();
    await seedNotificationTestData();
  });

  afterEach(async () => {
    await cleanupNotificationTestData();
  });

  afterAll(async () => {
    await cleanupNotificationTestData();
  });
}
