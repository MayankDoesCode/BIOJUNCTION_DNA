import { db } from '../db';
import type { AuditLog } from '../../types';

export const auditLogRepository = {
  async getAll(): Promise<AuditLog[]> {
    return db.auditLogs.orderBy('timestamp').reverse().toArray();
  },

  async getRecent(limit: number = 20): Promise<AuditLog[]> {
    return db.auditLogs.orderBy('timestamp').reverse().limit(limit).toArray();
  },

  async log(entry: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string }): Promise<string> {
    const id = entry.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEntry: AuditLog = {
      ...entry,
      id,
      eventId: entry.eventId || id,
      timestamp: new Date().toISOString(),
    };
    return db.auditLogs.add(fullEntry);
  },
};
