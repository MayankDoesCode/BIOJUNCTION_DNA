import { db } from '../db';
import type { FieldTest } from '../../types';

export const fieldTestRepository = {
  async getAll(): Promise<FieldTest[]> {
    return db.fieldTests.orderBy('timestamp').reverse().toArray();
  },

  async getRecent(limit: number = 5): Promise<FieldTest[]> {
    return db.fieldTests.orderBy('timestamp').reverse().limit(limit).toArray();
  },

  async getById(id: string): Promise<FieldTest | undefined> {
    return db.fieldTests.get(id);
  },

  async getByCaseId(caseId: string): Promise<FieldTest[]> {
    return db.fieldTests.where('caseId').equals(caseId).toArray();
  },

  async countTotal(): Promise<number> {
    return db.fieldTests.count();
  },

  async create(test: FieldTest): Promise<string> {
    return db.fieldTests.add(test);
  },
};
