import { db } from '../db';
import { DEMO_PROTEINS } from '../seedData';
import type { Protein } from '../../types';

export const proteinRepository = {
  /**
   * Retrieves all registered target proteins.
   * Auto-seeds DEMO_PROTEINS if table is currently empty.
   */
  async getAll(): Promise<Protein[]> {
    const count = await db.proteins.count();
    if (count === 0) {
      await db.proteins.bulkAdd(DEMO_PROTEINS);
    }
    return db.proteins.orderBy('uploadDate').reverse().toArray();
  },

  /**
   * Retrieves a target protein by ID.
   */
  async getById(id: string): Promise<Protein | undefined> {
    return db.proteins.get(id);
  },

  /**
   * Registers a new target protein structure record.
   */
  async create(protein: Protein): Promise<string> {
    const toSave: Protein = {
      ...protein,
      uploadDate: protein.uploadDate || new Date().toISOString(),
      status: protein.status || 'READY',
    };
    return db.proteins.add(toSave);
  },

  /**
   * Removes a protein structure from local database.
   */
  async delete(id: string): Promise<void> {
    await db.proteins.delete(id);
  },

  /**
   * Counts total registered protein targets.
   */
  async count(): Promise<number> {
    const count = await db.proteins.count();
    if (count === 0) {
      await db.proteins.bulkAdd(DEMO_PROTEINS);
      return DEMO_PROTEINS.length;
    }
    return count;
  },
};
