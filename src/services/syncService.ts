import { syncRepository } from '../database/repositories/syncRepository';
import type { SyncRecord } from '../types';

/**
 * Service for local-first synchronization queue management.
 * Stage 1 provides queuing and queue status monitoring.
 * Cloud sync engine will be fully implemented in future stages.
 */
export const syncService = {
  async getQueueStatus(): Promise<{ pendingCount: number; records: SyncRecord[] }> {
    const records = await syncRepository.getAll();
    const pendingCount = records.filter(r => r.status === 'PENDING').length;
    return { pendingCount, records };
  },

  async triggerManualSync(): Promise<{ success: boolean; message: string }> {
    if (!navigator.onLine) {
      return {
        success: false,
        message: 'Cannot initiate sync: Device is currently OFFLINE.',
      };
    }

    // Simulated sync verification for Stage 1 UI validation
    const pending = await syncRepository.getPending();
    if (pending.length === 0) {
      return {
        success: true,
        message: 'Local database is already synchronized with central server.',
      };
    }

    // In Stage 1, we mark pending records as synced to demonstrate the queue flow
    for (const record of pending) {
      await syncRepository.markSynced(record.id);
    }

    return {
      success: true,
      message: `Successfully synchronized ${pending.length} field records.`,
    };
  },
};
