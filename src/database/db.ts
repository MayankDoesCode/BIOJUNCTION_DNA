import Dexie, { type Table } from 'dexie';
import type {
  User,
  Case,
  FieldTest,
  Sample,
  Evidence,
  TestResult,
  Report,
  SyncRecord,
  AuditLog,
  Protein,
  Ligand,
  DockingJob,
  DockingResult,
} from '../types';

export class FieldTestingDatabase extends Dexie {
  users!: Table<User, string>;
  cases!: Table<Case, string>;
  fieldTests!: Table<FieldTest, string>;
  samples!: Table<Sample, string>;
  evidence!: Table<Evidence, string>;
  testResults!: Table<TestResult, string>;
  reports!: Table<Report, string>;
  syncQueue!: Table<SyncRecord, string>;
  auditLogs!: Table<AuditLog, string>;
  proteins!: Table<Protein, string>;
  ligands!: Table<Ligand, string>;
  dockingJobs!: Table<DockingJob, string>;
  dockingResults!: Table<DockingResult, string>;

  constructor() {
    super('FieldTestingDB');

    // Define database schema versions
    // Security rule: No passwords or credential hashes stored in IndexedDB.
    this.version(1).stores({
      users: 'id, username, role, badgeNumber, agency',
      cases: 'id, caseNumber, status, leadOfficerId, incidentDate, priority, createdAt',
      fieldTests: 'id, testNumber, caseId, sampleId, resultStatus, timestamp',
      samples: 'id, sampleNumber, caseId, custodyStatus, physicalState, collectedAt',
      evidence: 'id, evidenceTag, caseId, sampleId, barcode, sealNumber, createdAt',
      testResults: 'id, fieldTestId, sampleId, outcome, recordedAt',
      reports: 'id, reportNumber, caseId, type, status, generatedAt',
      syncQueue: 'id, entityType, entityId, status, createdAt',
      auditLogs: 'id, action, entityType, entityId, performedBy, timestamp',
    });

    // Version 2: Case Management Enhancement (Stage 3)
    // Indexes: caseNumber, status, priority, createdBy, assignedOfficer, createdAt, updatedAt, isArchived
    this.version(2).stores({
      cases: 'id, caseNumber, status, priority, createdBy, assignedOfficer, createdAt, updatedAt, isArchived',
    }).upgrade((tx) => {
      return tx.table('cases').toCollection().modify((c: Record<string, unknown>) => {
        if (!c.createdBy) c.createdBy = c.leadOfficerId || 'usr_001';
        if (!c.assignedOfficer) c.assignedOfficer = c.leadOfficerName || 'Specialist J. Miller';
        if (!c.priority) c.priority = 'MEDIUM';
        if (c.priority === 'URGENT') c.priority = 'CRITICAL';
        if (typeof c.location === 'string') {
          c.location = { address: c.location };
        }
        if (c.isArchived === undefined) c.isArchived = false;
      });
    });

    // Version 3: Drug–Protein Molecular Docking Foundation
    this.version(3).stores({
      proteins: 'id, name, structureId, source, status, uploadDate',
      ligands: 'id, name, isDemo, status, uploadDate',
      dockingJobs: 'id, proteinId, ligandId, status, createdAt',
      dockingResults: 'id, jobId, proteinId, ligandId, status, timestamp',
    });
  }
}

export const db = new FieldTestingDatabase();
