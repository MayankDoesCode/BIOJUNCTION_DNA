import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { DEMO_PROTEINS, DEMO_LIGANDS } from '../src/database/seedData';
import { proteinRepository } from '../src/database/repositories/proteinRepository';
import { ligandRepository } from '../src/database/repositories/ligandRepository';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import { dockingService } from '../src/services/dockingService';
import type { Protein, Ligand, BindingSite } from '../src/types';

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
  console.log('MOLECULAR DOCKING FOUNDATION AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // Test Suite 1: Dexie DB Version 3 Schema & Demo Proteins
  console.log('[Test Suite 1: Target Protein Repository & Demo Entities]');
  await db.proteins.clear();
  const proteins = await proteinRepository.getAll();
  assert(proteins.length >= 2, `proteinRepository auto-seeds demo target proteins (${proteins.length} found)`);

  const mpro = proteins.find((p) => p.structureId === '6LU7');
  assert(!!mpro, 'SARS-CoV-2 Mpro (6LU7) target receptor found in database');
  assert(mpro?.fileFormat === 'PDBQT', 'Target file format is PDBQT ready');
  assert(mpro?.status === 'READY', 'Target protein status is READY');

  // Add custom protein
  const customProtId = 'prot_test_001';
  await proteinRepository.create({
    id: customProtId,
    name: 'Custom Test Kinase Receptor',
    structureId: '7BV2',
    source: 'Manual Upload (PDB)',
    uploadDate: new Date().toISOString(),
    status: 'READY',
  });
  const customProt = await proteinRepository.getById(customProtId);
  assert(customProt?.structureId === '7BV2', 'Successfully created and retrieved custom target protein');
  await proteinRepository.delete(customProtId);
  const deletedProt = await proteinRepository.getById(customProtId);
  assert(!deletedProt, 'Successfully deleted custom target protein');

  // Test Suite 2: Candidate Molecules (Ligands) & Demo Marking
  console.log('\n[Test Suite 2: Candidate Ligands Repository & Demo Markers]');
  await db.ligands.clear();
  const ligands = await ligandRepository.getAll();
  assert(ligands.length >= 3, `ligandRepository auto-seeds demo candidate molecules (${ligands.length} found)`);

  const drugA = ligands.find((l) => l.name.includes('Drug A'));
  const drugB = ligands.find((l) => l.name.includes('Drug B'));
  const drugC = ligands.find((l) => l.name.includes('Drug C'));
  assert(!!drugA && drugA.isDemo === true, 'Drug A exists and is explicitly marked isDemo = true');
  assert(!!drugB && drugB.isDemo === true, 'Drug B exists and is explicitly marked isDemo = true');
  assert(!!drugC && drugC.isDemo === true, 'Drug C exists and is explicitly marked isDemo = true');

  // Add custom ligand
  const customLigId = 'lig_test_001';
  await ligandRepository.create({
    id: customLigId,
    name: 'Custom Experimental Small Molecule',
    formula: 'C20H24N2O3',
    isDemo: false,
    uploadDate: new Date().toISOString(),
    status: 'READY',
  });
  const customLig = await ligandRepository.getById(customLigId);
  assert(customLig?.formula === 'C20H24N2O3', 'Successfully created and retrieved candidate ligand');
  await ligandRepository.delete(customLigId);

  // Test Suite 3: Binding Site Validation
  console.log('\n[Test Suite 3: Binding Site Validation & Boundaries]');
  const validSite: BindingSite = {
    name: 'Mpro Active Site Cavity',
    description: 'Catalytic dyad Cys145-His41',
    centerX: -10.5,
    centerY: 12.3,
    centerZ: 68.8,
    sizeX: 22.0,
    sizeY: 22.0,
    sizeZ: 22.0,
    spacing: 0.375,
  };
  const validCheck = dockingService.validateBindingSite(validSite);
  assert(validCheck.isValid === true, 'Valid binding site coordinates pass validation');

  const invalidSite: BindingSite = {
    name: '',
    centerX: NaN,
    centerY: 0,
    centerZ: 0,
    sizeX: 0,
    sizeY: -5,
    sizeZ: 100, // Exceeds 60 Å limit
  };
  const invalidCheck = dockingService.validateBindingSite(invalidSite);
  assert(invalidCheck.isValid === false, 'Invalid binding site correctly flagged');
  assert(!!invalidCheck.errors.name, 'Name required error detected');
  assert(!!invalidCheck.errors.centerX, 'NaN coordinate error detected');
  assert(!!invalidCheck.errors.sizeX, 'Zero size error detected');
  assert(!!invalidCheck.errors.dimensions, 'Exceeded dimension limit (>60 Å) error detected');

  // Test Suite 4: Docking Service Abstraction & Scientific Integrity
  console.log('\n[Test Suite 4: Docking Service & Scientific Integrity Rules]');
  const engineStatus = await dockingService.getEngineStatus();
  assert(engineStatus.mode === 'DEMO_STANDBY', 'Engine status correctly reports DEMO_STANDBY');
  assert(engineStatus.isAvailable === false, 'isAvailable = false (no false claims of real calculation)');
  assert(
    engineStatus.message.includes('Real docking engine unavailable') ||
    engineStatus.message.includes('Demo Mode — docking engine integration pending'),
    'Displays required engine unavailable / Demo Mode string'
  );

  // Submit docking job
  const submission = await dockingService.submitDockingJob({
    protein: mpro!,
    ligand: drugA!,
    bindingSite: validSite,
    notes: 'Test run with Drug A lead analog',
  });

  assert(!!submission.job.id, 'Docking job created with unique ID');
  assert(submission.job.isDemoMode === true, 'Job flagged as isDemoMode = true');
  assert(submission.result.hasRealResult === false, 'Result strictly flags hasRealResult = false');
  assert(submission.result.dockingScore === undefined, 'Does NOT fabricate fake numerical docking scores');
  assert(submission.result.status === 'NO_RESULT', 'Result status is NO_RESULT');
  assert(
    submission.result.dockingStatusNote.includes('Real docking engine unavailable') ||
    submission.result.dockingStatusNote.includes('Demo Mode — docking engine integration pending'),
    'Result note explicitly includes engine unavailable / Demo Mode notice'
  );

  // Verify in local database
  const fetchedJob = await dockingRepository.getJobById(submission.job.id);
  assert(!!fetchedJob, 'Docking job successfully persisted in Dexie IndexedDB');
  const fetchedResult = await dockingRepository.getResultByJobId(submission.job.id);
  assert(!!fetchedResult, 'Docking result successfully persisted in Dexie IndexedDB');

  console.log('\n======================================================');
  console.log(`DOCKING TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
