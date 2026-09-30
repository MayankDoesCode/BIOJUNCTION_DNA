import { db } from '../db';
import type { Sample } from '../../types';

export const sampleRepository = {
  async getAll(): Promise<Sample[]> {
    return db.samples.orderBy('collectedAt').reverse().toArray();
  },

  async getById(id: string): Promise<Sample | undefined> {
    return db.samples.get(id);
  },

  async getByCaseId(caseId: string): Promise<Sample[]> {
    return db.samples.where('caseId').equals(caseId).toArray();
  },

  async countPending(): Promise<number> {
    return db.samples.filter((s) => s.custodyStatus !== 'PROCESSED').count();
  },

  async countTotal(): Promise<number> {
    return db.samples.count();
  },

  async create(sample: Sample): Promise<string> {
    return db.samples.add(sample);
  },
};
