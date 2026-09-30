import { db } from '../db';
import type { Report } from '../../types';

export const reportRepository = {
  async getAll(): Promise<Report[]> {
    return db.reports.orderBy('generatedAt').reverse().toArray();
  },

  async getRecent(limit: number = 5): Promise<Report[]> {
    return db.reports.orderBy('generatedAt').reverse().limit(limit).toArray();
  },

  async countTotal(): Promise<number> {
    return db.reports.count();
  },

  async create(report: Report): Promise<string> {
    return db.reports.add(report);
  },
};
