import { db } from '../db';
import type { Case, CaseFilters, CaseSortOption, CasePriority } from '../../types';

const PRIORITY_WEIGHT: Record<CasePriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const caseRepository = {
  /**
   * Retrieves all non-archived cases by default, sorted by createdAt descending.
   */
  async getAll(includeArchived: boolean = false): Promise<Case[]> {
    const cases = await db.cases.orderBy('createdAt').reverse().toArray();
    if (includeArchived) return cases;
    return cases.filter((c) => !c.isArchived);
  },

  /**
   * Alias for getAll to fulfill getCases() requirement.
   */
  async getCases(includeArchived: boolean = false): Promise<Case[]> {
    return this.getAll(includeArchived);
  },

  /**
   * Retrieves a single case by its unique ID.
   */
  async getById(id: string): Promise<Case | undefined> {
    return db.cases.get(id);
  },

  /**
   * Alias for getById to fulfill getCaseById() requirement.
   */
  async getCaseById(id: string): Promise<Case | undefined> {
    return this.getById(id);
  },

  /**
   * Retrieves a case by its human-readable caseNumber (e.g. FT-2026-0001).
   */
  async getByCaseNumber(caseNumber: string): Promise<Case | undefined> {
    return db.cases.where('caseNumber').equalsIgnoreCase(caseNumber.trim()).first();
  },

  /**
   * Retrieves recent non-archived cases.
   */
  async getRecent(limit: number = 5): Promise<Case[]> {
    const all = await this.getAll(false);
    return all.slice(0, limit);
  },

  /**
   * Count of active (non-closed, non-cancelled, non-archived) cases.
   */
  async countActive(): Promise<number> {
    return db.cases
      .filter((c) => !c.isArchived && c.status !== 'CLOSED' && c.status !== 'CANCELLED')
      .count();
  },

  /**
   * Total count of all non-archived cases.
   */
  async countTotal(): Promise<number> {
    return db.cases.filter((c) => !c.isArchived).count();
  },

  /**
   * Creates a new case record.
   */
  async createCase(newCase: Case): Promise<string> {
    const now = new Date().toISOString();
    const caseToSave: Case = {
      ...newCase,
      createdAt: newCase.createdAt || now,
      updatedAt: now,
      isArchived: newCase.isArchived ?? false,
    };
    return db.cases.add(caseToSave);
  },

  /**
   * Alias for createCase to preserve Stage 1 compatibility.
   */
  async create(newCase: Case): Promise<string> {
    return this.createCase(newCase);
  },

  /**
   * Updates an existing case with timestamp refresh.
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<number> {
    return db.cases.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Alias for updateCase to preserve Stage 1 compatibility.
   */
  async update(id: string, updates: Partial<Case>): Promise<number> {
    return this.updateCase(id, updates);
  },

  /**
   * Soft-delete/Archive a case. Recommended over hard-deletion to preserve chain of custody.
   */
  async archiveCase(id: string): Promise<number> {
    return db.cases.update(id, {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Hard-delete a case from local IndexedDB.
   */
  async deleteCase(id: string): Promise<void> {
    await db.cases.delete(id);
  },

  /**
   * Alias for deleteCase to preserve Stage 1 compatibility.
   */
  async delete(id: string): Promise<void> {
    return this.deleteCase(id);
  },

  /**
   * Generates the next sequential unique Case Number in format FT-YYYY-XXXX.
   * Prevents collision with any existing local record.
   */
  async generateNextCaseNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `FT-${currentYear}-`;
    const allCases = await db.cases.toArray();

    let maxSeq = 0;
    for (const c of allCases) {
      if (c.caseNumber && c.caseNumber.startsWith(prefix)) {
        const seqStr = c.caseNumber.substring(prefix.length);
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  },

  /**
   * Searches and filters in-memory case lists according to criteria.
   */
  filterCases(cases: Case[], filters: CaseFilters): Case[] {
    let result = cases;

    if (!filters.includeArchived) {
      result = result.filter((c) => !c.isArchived);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'ALL') {
      result = result.filter((c) => c.priority === filters.priority);
    }

    if (filters.assignedOfficer && filters.assignedOfficer !== 'ALL') {
      result = result.filter(
        (c) =>
          c.assignedOfficer === filters.assignedOfficer ||
          c.leadOfficerName === filters.assignedOfficer
      );
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const matchCaseNumber = c.caseNumber.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDescription = (c.description || '').toLowerCase().includes(q);
        const matchOfficer = (c.assignedOfficer || c.leadOfficerName || '').toLowerCase().includes(q);
        const matchAddress = typeof c.location === 'object'
          ? (c.location.address || '').toLowerCase().includes(q)
          : (c.location || '').toLowerCase().includes(q);

        return matchCaseNumber || matchTitle || matchDescription || matchOfficer || matchAddress;
      });
    }

    return result;
  },

  /**
   * Search helper fulfilling searchCases() requirement.
   */
  searchCases(cases: Case[], query: string): Case[] {
    return this.filterCases(cases, { searchQuery: query });
  },

  /**
   * Predictable multi-column sorting helper.
   */
  sortCases(cases: Case[], sort: CaseSortOption): Case[] {
    const { field, direction } = sort;
    const factor = direction === 'asc' ? 1 : -1;

    return [...cases].sort((a, b) => {
      switch (field) {
        case 'caseNumber':
          return a.caseNumber.localeCompare(b.caseNumber) * factor;

        case 'title':
          return a.title.localeCompare(b.title) * factor;

        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;

        case 'updatedAt':
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor;

        case 'priority': {
          const weightA = PRIORITY_WEIGHT[a.priority] || 0;
          const weightB = PRIORITY_WEIGHT[b.priority] || 0;
          return (weightA - weightB) * factor;
        }

        case 'status':
          return a.status.localeCompare(b.status) * factor;

        default:
          return 0;
      }
    });
  },

  /**
   * Combined filter and sort pipeline.
   */
  async filterAndSort(filters: CaseFilters, sort: CaseSortOption): Promise<Case[]> {
    const all = await this.getAll(filters.includeArchived);
    const filtered = this.filterCases(all, filters);
    return this.sortCases(filtered, sort);
  },
};
