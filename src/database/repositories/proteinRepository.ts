import { db } from '../db';
import { DEMO_PROTEINS } from '../seedData';
import { getDefaultProteinStructure } from '../defaultStructures';
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
    const list = await db.proteins.orderBy('uploadDate').reverse().toArray();
    return list.map((p) => {
      if (!p.fileData) {
        return {
          ...p,
          fileData: getDefaultProteinStructure(p.structureId || p.name),
        };
      }
      return p;
    });
  },

  /**
   * Retrieves a target protein by ID.
   */
  async getById(id: string): Promise<Protein | undefined> {
    const p = await db.proteins.get(id);
    if (!p) return undefined;
    if (!p.fileData) {
      return {
        ...p,
        fileData: getDefaultProteinStructure(p.structureId || p.name),
      };
    }
    return p;
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
