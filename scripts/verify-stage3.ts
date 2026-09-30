import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { DEMO_CASES } from '../src/database/seedData';
import { caseRepository } from '../src/database/repositories/caseRepository';
import { canTransitionCaseStatus, getAllowedNextStatuses } from '../src/utils/caseWorkflow';
import { hasPermission } from '../src/utils/permissions';
import { auditService } from '../src/services/auditService';
import type { Case, CaseStatus, CasePriority, UserRole } from '../src/types';

// Mock storage for Node test runner
const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

// @ts-ignore
global.sessionStorage = {
  getItem: (key: string) => mockSessionStorage[key] || null,
  setItem: (key: string, val: string) => { mockSessionStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockSessionStorage[key]; },
  clear: () => { for (const k in mockSessionStorage) delete mockSessionStorage[k]; },
  key: () => null,
  length: 0,
};

// @ts-ignore
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; },
  key: () => null,
  length: 0,
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('STAGE 3 AUTOMATED TEST SUITE: CASE MANAGEMENT');
  console.log('======================================================\n');

  // Step 0: Seed database with DEMO_CASES
  console.log('[Test Suite 1: Dexie DB Version 2 & Case Data Model]');
  await db.cases.clear();
  await db.auditLogs.clear();
  await db.cases.bulkAdd(DEMO_CASES);

  const initialCount = await db.cases.count();
  assert(initialCount === DEMO_CASES.length, `Database initialized with ${DEMO_CASES.length} demo cases`);

  // Verify Case Data Model fields on seed records
  const sampleCase = await db.cases.get('case_2026_089');
  assert(!!sampleCase, 'Retrieved sample case case_2026_089');
  assert(sampleCase?.caseNumber === 'FT-2026-0001', 'Case number format FT-2026-0001 matches requirement');
  assert(typeof sampleCase?.location === 'object', 'Location is structured object with address/coordinates');
  assert(sampleCase?.priority === 'HIGH', 'Priority is valid CasePriority (HIGH)');
  assert(sampleCase?.status === 'IN_PROGRESS', 'Status is valid CaseStatus (IN_PROGRESS)');
  assert(sampleCase?.createdBy === 'Specialist J. Miller', 'CreatedBy field populated');
  assert(sampleCase?.assignedOfficer === 'Specialist J. Miller', 'AssignedOfficer field populated');
  assert(sampleCase?.isArchived === false, 'isArchived defaults to false');

  // Test Suite 2: Sequential Case Number Generation
  console.log('\n[Test Suite 2: Case Number Generation & Uniqueness]');
  const nextNum = await caseRepository.generateNextCaseNumber();
  assert(nextNum === 'FT-2026-0005', `Next generated case number is sequential: ${nextNum}`);

  // Test Suite 3: Repository CRUD Operations
  console.log('\n[Test Suite 3: Repository CRUD Operations]');
  const newCaseId = 'case_test_new_001';
  const newCase: Case = {
    id: newCaseId,
    caseNumber: nextNum,
    title: 'Interstate 40 Border Checkpoint Inspection',
    description: 'Suspicious transport vehicle diverted for colorimetric analysis',
    status: 'OPEN',
    priority: 'CRITICAL',
    location: {
      address: 'I-40 Eastbound Weigh Station, Mile Marker 78',
      latitude: 35.1882,
      longitude: -101.8313,
    },
    createdBy: 'Commander R. Reyes',
    assignedOfficer: 'Specialist J. Miller',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Requires dual-custody verification',
    isArchived: false,
  };

  await caseRepository.createCase(newCase);
  await auditService.record('CASE_CREATED', 'Case', newCaseId, `Created case ${newCase.caseNumber}`);

  const fetchedCase = await caseRepository.getCaseById(newCaseId);
  assert(!!fetchedCase, 'createCase() and getCaseById() work correctly');
  assert(fetchedCase?.caseNumber === nextNum, 'Stored case preserves auto-generated case number');
  assert(fetchedCase?.priority === 'CRITICAL', 'Stored case preserves priority CRITICAL');

  // Update Case
  await caseRepository.updateCase(newCaseId, { title: 'Updated Title Inspection' });
  const updatedCase = await caseRepository.getCaseById(newCaseId);
  assert(updatedCase?.title === 'Updated Title Inspection', 'updateCase() successfully modifies case title');

  // Soft Archive Case
  await caseRepository.archiveCase(newCaseId);
  const archivedCase = await caseRepository.getCaseById(newCaseId);
  assert(archivedCase?.isArchived === true, 'archiveCase() flags record as isArchived = true');

  const activeCasesAfterArchive = await caseRepository.getCases(false);
  const foundInActive = activeCasesAfterArchive.some((c) => c.id === newCaseId);
  assert(!foundInActive, 'Archived case excluded from active operational getCases() by default');

  const allCasesIncludingArchive = await caseRepository.getCases(true);
  const foundInAll = allCasesIncludingArchive.some((c) => c.id === newCaseId);
  assert(foundInAll, 'Archived case preserved in getCases(true) for complete chain of custody');

  // Hard delete check
  await caseRepository.deleteCase(newCaseId);
  const deletedCheck = await caseRepository.getCaseById(newCaseId);
  assert(!deletedCheck, 'deleteCase() successfully removes record from local database');

  // Test Suite 4: Search & Filtering
  console.log('\n[Test Suite 4: Search & Filtering]');
  const allCases = await caseRepository.getAll(true);

  // Search by caseNumber
  const searchByNumber = caseRepository.searchCases(allCases, 'FT-2026-0002');
  assert(searchByNumber.length === 1 && searchByNumber[0].caseNumber === 'FT-2026-0002', 'Search by caseNumber matches precisely');

  // Search by title
  const searchByTitle = caseRepository.searchCases(allCases, 'Warehouse');
  assert(searchByTitle.length >= 1, 'Search by title matches case records');

  // Search by description
  const searchByDesc = caseRepository.searchCases(allCases, 'crystalline');
  assert(searchByDesc.length >= 1, 'Search by description matches observations');

  // Search by assigned officer
  const searchByOfficer = caseRepository.searchCases(allCases, 'Miller');
  assert(searchByOfficer.length >= 1, 'Search by assigned officer matches records');

  // Filter by Status
  const openCases = caseRepository.filterCases(allCases, { status: 'OPEN' });
  assert(openCases.every((c) => c.status === 'OPEN'), 'Filter by status returns only OPEN cases');

  // Filter by Priority
  const criticalCases = caseRepository.filterCases(allCases, { priority: 'CRITICAL' });
  assert(criticalCases.every((c) => c.priority === 'CRITICAL'), 'Filter by priority returns only CRITICAL cases');

  // Filter by Assigned Officer
  const millerCases = caseRepository.filterCases(allCases, { assignedOfficer: 'Specialist J. Miller' });
  assert(millerCases.length > 0 && millerCases.every((c) => c.assignedOfficer === 'Specialist J. Miller'), 'Filter by assigned officer matches selected officer');

  // Test Suite 5: Predictable Sorting
  console.log('\n[Test Suite 5: Predictable Sorting]');
  // Sort by Priority Descending (CRITICAL > HIGH > MEDIUM > LOW)
  const sortedPriority = caseRepository.sortCases(allCases, { field: 'priority', direction: 'desc' });
  const priorityWeights: Record<CasePriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  let isPrioritySorted = true;
  for (let i = 0; i < sortedPriority.length - 1; i++) {
    if (priorityWeights[sortedPriority[i].priority] < priorityWeights[sortedPriority[i + 1].priority]) {
      isPrioritySorted = false;
      break;
    }
  }
  assert(isPrioritySorted, 'Sort by priority correctly orders CRITICAL -> HIGH -> MEDIUM -> LOW');

  // Sort by Case Number Ascending
  const sortedNumber = caseRepository.sortCases(allCases, { field: 'caseNumber', direction: 'asc' });
  let isNumberSorted = true;
  for (let i = 0; i < sortedNumber.length - 1; i++) {
    if (sortedNumber[i].caseNumber.localeCompare(sortedNumber[i + 1].caseNumber) > 0) {
      isNumberSorted = false;
      break;
    }
  }
  assert(isNumberSorted, 'Sort by caseNumber correctly orders in ascending alphanumeric sequence');

  // Test Suite 6: Status Workflow Transitions
  console.log('\n[Test Suite 6: Case Status Workflow State Machine]');
  // Valid transitions
  assert(canTransitionCaseStatus('DRAFT', 'OPEN') === true, 'Workflow allows DRAFT -> OPEN');
  assert(canTransitionCaseStatus('DRAFT', 'CANCELLED') === true, 'Workflow allows DRAFT -> CANCELLED');
  assert(canTransitionCaseStatus('OPEN', 'IN_PROGRESS') === true, 'Workflow allows OPEN -> IN_PROGRESS');
  assert(canTransitionCaseStatus('IN_PROGRESS', 'SAMPLE_COLLECTED') === true, 'Workflow allows IN_PROGRESS -> SAMPLE_COLLECTED');
  assert(canTransitionCaseStatus('SAMPLE_COLLECTED', 'TEST_COMPLETED') === true, 'Workflow allows SAMPLE_COLLECTED -> TEST_COMPLETED');
  assert(canTransitionCaseStatus('TEST_COMPLETED', 'UNDER_REVIEW') === true, 'Workflow allows TEST_COMPLETED -> UNDER_REVIEW');
  assert(canTransitionCaseStatus('UNDER_REVIEW', 'CLOSED') === true, 'Workflow allows UNDER_REVIEW -> CLOSED');
  assert(canTransitionCaseStatus('UNDER_REVIEW', 'IN_PROGRESS') === true, 'Workflow allows UNDER_REVIEW -> IN_PROGRESS (return for correction)');

  // Invalid transitions
  assert(canTransitionCaseStatus('DRAFT', 'CLOSED') === false, 'Workflow rejects invalid jump DRAFT -> CLOSED');
  assert(canTransitionCaseStatus('OPEN', 'TEST_COMPLETED') === false, 'Workflow rejects invalid jump OPEN -> TEST_COMPLETED');
  assert(canTransitionCaseStatus('CLOSED', 'OPEN') === false, 'Workflow rejects reopening terminal CLOSED case');
  assert(canTransitionCaseStatus('CANCELLED', 'IN_PROGRESS') === false, 'Workflow rejects resuming terminal CANCELLED case');

  const allowedForOpen = getAllowedNextStatuses('OPEN');
  assert(allowedForOpen.includes('IN_PROGRESS') && allowedForOpen.includes('CANCELLED'), 'getAllowedNextStatuses(OPEN) returns [IN_PROGRESS, CANCELLED]');

  // Test Suite 7: Role-Based Access Control (RBAC) Matrix for Cases
  console.log('\n[Test Suite 7: RBAC Case Management Permissions]');
  // ADMIN
  assert(hasPermission('ADMIN', 'CASE_CREATE') === true, 'ADMIN has CASE_CREATE');
  assert(hasPermission('ADMIN', 'CASE_VIEW') === true, 'ADMIN has CASE_VIEW');
  assert(hasPermission('ADMIN', 'CASE_EDIT') === true, 'ADMIN has CASE_EDIT');
  assert(hasPermission('ADMIN', 'CASE_ASSIGN') === true, 'ADMIN has CASE_ASSIGN');
  assert(hasPermission('ADMIN', 'CASE_DELETE') === true, 'ADMIN has CASE_DELETE');

  // FIELD_OFFICER
  assert(hasPermission('FIELD_OFFICER', 'CASE_CREATE') === true, 'FIELD_OFFICER can create cases');
  assert(hasPermission('FIELD_OFFICER', 'CASE_VIEW') === true, 'FIELD_OFFICER can view cases');
  assert(hasPermission('FIELD_OFFICER', 'CASE_EDIT') === true, 'FIELD_OFFICER can edit permitted cases');
  assert(hasPermission('FIELD_OFFICER', 'CASE_ASSIGN') === false, 'FIELD_OFFICER cannot assign cases to other officers');
  assert(hasPermission('FIELD_OFFICER', 'CASE_DELETE') === false, 'FIELD_OFFICER cannot delete/archive cases');

  // SUPERVISOR
  assert(hasPermission('SUPERVISOR', 'CASE_VIEW') === true, 'SUPERVISOR can view all cases');
  assert(hasPermission('SUPERVISOR', 'CASE_EDIT') === true, 'SUPERVISOR can edit cases');
  assert(hasPermission('SUPERVISOR', 'CASE_ASSIGN') === true, 'SUPERVISOR can assign cases to officers');
  assert(hasPermission('SUPERVISOR', 'CASE_DELETE') === true, 'SUPERVISOR can archive cases');
  assert(hasPermission('SUPERVISOR', 'CASE_CREATE') === false, 'SUPERVISOR does not create field intake cases');

  // LAB_USER
  assert(hasPermission('LAB_USER', 'CASE_VIEW') === true, 'LAB_USER can view relevant cases');
  assert(hasPermission('LAB_USER', 'CASE_CREATE') === false, 'LAB_USER cannot create field cases');
  assert(hasPermission('LAB_USER', 'CASE_ASSIGN') === false, 'LAB_USER cannot assign cases');

  // VIEWER
  assert(hasPermission('VIEWER', 'CASE_VIEW') === true, 'VIEWER can view cases');
  assert(hasPermission('VIEWER', 'CASE_CREATE') === false, 'VIEWER is read-only (no create)');
  assert(hasPermission('VIEWER', 'CASE_EDIT') === false, 'VIEWER is read-only (no edit)');
  assert(hasPermission('VIEWER', 'CASE_DELETE') === false, 'VIEWER is read-only (no delete/archive)');

  // Test Suite 8: Audit Log Lifecycle for Cases
  console.log('\n[Test Suite 8: Forensic Audit Log Recording]');
  const auditLogs = await db.auditLogs.toArray();
  const caseCreatedLog = auditLogs.find((l) => l.action === 'CASE_CREATED');
  assert(!!caseCreatedLog, 'CASE_CREATED audit event logged in audit trail');

  // Record simulated audit events
  await auditService.record('STATUS_CHANGED', 'Case', 'case_001', 'Status transitioned from OPEN to IN_PROGRESS');
  await auditService.record('PRIORITY_CHANGED', 'Case', 'case_001', 'Priority upgraded to CRITICAL');
  await auditService.record('CASE_ASSIGNED', 'Case', 'case_001', 'Reassigned to Detective S. Chen');
  await auditService.record('CASE_ARCHIVED', 'Case', 'case_001', 'Case archived by Supervisor');

  const updatedAuditLogs = await db.auditLogs.toArray();
  assert(updatedAuditLogs.some((l) => l.action === 'STATUS_CHANGED'), 'STATUS_CHANGED audit event verified');
  assert(updatedAuditLogs.some((l) => l.action === 'PRIORITY_CHANGED'), 'PRIORITY_CHANGED audit event verified');
  assert(updatedAuditLogs.some((l) => l.action === 'CASE_ASSIGNED'), 'CASE_ASSIGNED audit event verified');
  assert(updatedAuditLogs.some((l) => l.action === 'CASE_ARCHIVED'), 'CASE_ARCHIVED audit event verified');

  console.log('\n======================================================');
  console.log(`STAGE 3 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
