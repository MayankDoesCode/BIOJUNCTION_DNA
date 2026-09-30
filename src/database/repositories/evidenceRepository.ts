import { db } from '../db';
import type { Evidence } from '../../types';

export const evidenceRepository = {
  async getAll(): Promise<Evidence[]> {
    return db.evidence.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<Evidence | undefined> {
    return db.evidence.get(id);
  },

  async getByCaseId(caseId: string): Promise<Evidence[]> {
    return db.evidence.where('caseId').equals(caseId).toArray();
  },

  async countTotal(): Promise<number> {
    return db.evidence.count();
  },

  async create(evidence: Evidence): Promise<string> {
    return db.evidence.add(evidence);
  },
};
