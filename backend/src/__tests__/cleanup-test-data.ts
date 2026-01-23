import './setup.js';
import { cleanupNotificationTestData } from '@/modules/notifications/__tests__/db-fixtures.js';
import { closeDatabase } from '@/config/database.js';

(async () => {
  try {
    await cleanupNotificationTestData();
  } finally {
    await closeDatabase();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
