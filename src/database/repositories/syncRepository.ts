import { db } from '../db';
import type { SyncRecord } from '../../types';

export const syncRepository = {
  async getAll(): Promise<SyncRecord[]> {
    return db.syncQueue.orderBy('createdAt').reverse().toArray();
  },

  async getPending(): Promise<SyncRecord[]> {
    return db.syncQueue.where('status').equals('PENDING').toArray();
  },

  async countPending(): Promise<number> {
    return db.syncQueue.where('status').equals('PENDING').count();
  },

  async enqueue(record: Omit<SyncRecord, 'id' | 'createdAt' | 'status' | 'attempts'>): Promise<string> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRecord: SyncRecord = {
      ...record,
      id,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    return db.syncQueue.add(fullRecord);
  },

  async markSynced(id: string): Promise<number> {
    return db.syncQueue.update(id, {
      status: 'SYNCED',
      lastAttemptAt: new Date().toISOString(),
    });
  },

  async markFailed(id: string, error: string): Promise<number> {
    const record = await db.syncQueue.get(id);
    const attempts = (record?.attempts ?? 0) + 1;
    return db.syncQueue.update(id, {
      status: 'FAILED',
      attempts,
      error,
      lastAttemptAt: new Date().toISOString(),
    });
  },
};
