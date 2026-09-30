import { db } from './db';
import {
  DEMO_USERS,
  DEMO_CASES,
  DEMO_SAMPLES,
  DEMO_FIELD_TESTS,
  DEMO_EVIDENCE,
  DEMO_TEST_RESULTS,
  DEMO_REPORTS,
  DEMO_SYNC_RECORDS,
  DEMO_AUDIT_LOGS,
} from './seedData';

/**
 * Initializes the IndexedDB database.
 * Seeds with demonstration field testing records on first run.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();

    const caseCount = await db.cases.count();
    if (caseCount === 0) {
      console.info('[FieldTestingDB] Initializing local database with demo seed records...');
      await db.transaction('rw', [
        db.users,
        db.cases,
        db.samples,
        db.fieldTests,
        db.evidence,
        db.testResults,
        db.reports,
        db.syncQueue,
        db.auditLogs,
      ], async () => {
        await db.users.bulkAdd(DEMO_USERS);
        await db.cases.bulkAdd(DEMO_CASES);
        await db.samples.bulkAdd(DEMO_SAMPLES);
        await db.fieldTests.bulkAdd(DEMO_FIELD_TESTS);
        await db.evidence.bulkAdd(DEMO_EVIDENCE);
        await db.testResults.bulkAdd(DEMO_TEST_RESULTS);
        await db.reports.bulkAdd(DEMO_REPORTS);
        await db.syncQueue.bulkAdd(DEMO_SYNC_RECORDS);
        await db.auditLogs.bulkAdd(DEMO_AUDIT_LOGS);
      });
      console.info('[FieldTestingDB] Initialization complete.');
    }
  } catch (error) {
    console.error('[FieldTestingDB] Failed to initialize local IndexedDB database:', error);
    throw error;
  }
}
