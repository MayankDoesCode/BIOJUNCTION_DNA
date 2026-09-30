import { db } from '../db';
import { DEMO_LIGANDS } from '../seedData';
import type { Ligand } from '../../types';

export const ligandRepository = {
  /**
   * Retrieves all candidate drug molecules.
   * Auto-seeds DEMO_LIGANDS (Drug A, Drug B, Drug C) if table is empty.
   */
  async getAll(): Promise<Ligand[]> {
    const count = await db.ligands.count();
    if (count === 0) {
      await db.ligands.bulkAdd(DEMO_LIGANDS);
    }
    return db.ligands.orderBy('uploadDate').reverse().toArray();
  },

  /**
   * Retrieves a candidate molecule by ID.
   */
  async getById(id: string): Promise<Ligand | undefined> {
    return db.ligands.get(id);
  },

  /**
   * Registers a new candidate molecule.
   */
  async create(ligand: Ligand): Promise<string> {
    const toSave: Ligand = {
      ...ligand,
      uploadDate: ligand.uploadDate || new Date().toISOString(),
      status: ligand.status || 'READY',
      isDemo: ligand.isDemo ?? false,
    };
    return db.ligands.add(toSave);
  },

  /**
   * Removes a candidate molecule.
   */
  async delete(id: string): Promise<void> {
    await db.ligands.delete(id);
  },

  /**
   * Resets candidates to default demo set.
   */
  async resetToDemo(): Promise<void> {
    await db.ligands.clear();
    await db.ligands.bulkAdd(DEMO_LIGANDS);
  },
};
