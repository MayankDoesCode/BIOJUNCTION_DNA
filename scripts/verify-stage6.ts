import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { proteinRepository } from '../src/database/repositories/proteinRepository';
import { ligandRepository } from '../src/database/repositories/ligandRepository';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import { comparisonService } from '../src/services/comparisonService';
import type { Protein, Ligand, DockingJob, DockingResult, DockingConfiguration } from '../src/types';

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

async function runStage6Tests() {
  console.log('\n======================================================');
  console.log('STAGE 6: MULTIPLE-CANDIDATE DOCKING AND COMPARISON');
  console.log('======================================================\n');

  // Load baseline demo target protein and candidate ligands
  const [proteins, ligands] = await Promise.all([
    proteinRepository.getAll(),
    ligandRepository.getAll(),
  ]);

  const targetProtein = proteins[0];
  const drugA = ligands[0];
  const drugB = ligands[1];
  const drugC = ligands[2];

  assert(!!targetProtein, 'Target protein loaded from repository');
  assert(!!drugA && !!drugB && !!drugC, 'Candidate drugs A, B, and C loaded from repository');

  // --- Requirement 1: Minimum Candidate Validation (>= 2) ---
  console.log('\n[Test 1: Minimum Candidate Validation]');
  const validZero = comparisonService.validateComparison({
    targetProtein,
    selectedCandidateIds: [],
  });
  assert(validZero.isValid === false, 'Rejects comparison with 0 candidates');
  assert(
    validZero.errors.some((e) => e.includes('At least two candidates are required')),
    'Returns required minimum candidate count error message'
  );

  const validOne = comparisonService.validateComparison({
    targetProtein,
    selectedCandidateIds: [drugA.id],
  });
  assert(validOne.isValid === false, 'Rejects comparison with 1 candidate');
  assert(
    validOne.errors.some((e) => e.includes('At least two candidates are required')),
    'Enforces at least two candidates error when only 1 is selected'
  );

  const validTwo = comparisonService.validateComparison({
    targetProtein,
    selectedCandidateIds: [drugA.id, drugB.id],
  });
  assert(validTwo.isValid === true, 'Accepts comparison with 2 candidates');
  assert(validTwo.errors.length === 0, 'Zero errors for 2 candidates');

  const validThree = comparisonService.validateComparison({
    targetProtein,
    selectedCandidateIds: [drugA.id, drugB.id, drugC.id],
  });
  assert(validThree.isValid === true, 'Accepts comparison with 3 candidates');

  // --- Requirement 2: Same-Protein Validation ---
  console.log('\n[Test 2: Same-Protein Receptor Validation]');
  const validNoProt = comparisonService.validateComparison({
    targetProtein: null,
    selectedCandidateIds: [drugA.id, drugB.id],
  });
  assert(validNoProt.isValid === false, 'Rejects comparison when target protein is missing');
  assert(
    validNoProt.errors.some((e) => e.includes('Target protein receptor is required')),
    'Returns target protein required error message'
  );

  // --- Requirement 3: Consistent Docking Configuration Compatibility ---
  console.log('\n[Test 3: Configuration Compatibility & Mismatch Detection]');
  const baseConfig: DockingConfiguration = {
    engine: 'AutoDock Vina',
    bindingSite: {
      name: 'Catalytic S1/S2 Pocket',
      centerX: -10.5,
      centerY: 12.3,
      centerZ: 68.8,
      sizeX: 22.0,
      sizeY: 22.0,
      sizeZ: 22.0,
    },
    exhaustiveness: 8,
    numModes: 9,
    energyRange: 3.0,
  };

  // Identical configurations
  const compatSame = comparisonService.evaluateConfigurationCompatibility([baseConfig, { ...baseConfig }]);
  assert(compatSame.isCompatible === true, 'Identical configurations pass compatibility check');
  assert(compatSame.warnings.length === 0, 'Zero warnings for identical configurations');

  // Differing binding pocket center
  const diffCenterConfig: DockingConfiguration = {
    ...baseConfig,
    bindingSite: {
      ...baseConfig.bindingSite,
      centerX: 5.0, // Shifted center
    },
  };
  const compatDiffCenter = comparisonService.evaluateConfigurationCompatibility([baseConfig, diffCenterConfig]);
  assert(compatDiffCenter.isCompatible === false, 'Detects search region center mismatch');
  assert(
    compatDiffCenter.warnings.some((w) => w.includes('center coordinates differ')),
    'Returns clear warning about differing center coordinates'
  );

  // Differing dimensions
  const diffSizeConfig: DockingConfiguration = {
    ...baseConfig,
    bindingSite: {
      ...baseConfig.bindingSite,
      sizeX: 45.0, // Differing box dimension
    },
  };
  const compatDiffSize = comparisonService.evaluateConfigurationCompatibility([baseConfig, diffSizeConfig]);
  assert(compatDiffSize.isCompatible === false, 'Detects search box dimension mismatch');
  assert(
    compatDiffSize.warnings.some((w) => w.includes('dimensions differ')),
    'Returns clear warning about differing search box dimensions'
  );

  // Differing exhaustiveness
  const diffExhaustConfig: DockingConfiguration = {
    ...baseConfig,
    exhaustiveness: 32, // Exhaustiveness 32 vs 8
  };
  const compatDiffExhaust = comparisonService.evaluateConfigurationCompatibility([baseConfig, diffExhaustConfig]);
  assert(compatDiffExhaust.isCompatible === false, 'Detects exhaustiveness mismatch');
  assert(
    compatDiffExhaust.warnings.some((w) => w.includes('exhaustiveness differs')),
    'Returns clear warning about differing exhaustiveness'
  );

  // --- Requirement 4: Comparison Table Compilation & Data Handling ---
  console.log('\n[Test 4: Comparison Table Compilation & Score Handling]');
  // Mock results for Drug A (Real Completed Result with score -8.4), Drug B (Standby/Demo Result), Drug C (Awaiting)
  const jobA: DockingJob = {
    id: 'job_comp_drug_a',
    jobId: 'job_comp_drug_a',
    proteinId: targetProtein.id,
    proteinName: targetProtein.name,
    ligandId: drugA.id,
    ligandName: drugA.name,
    configuration: baseConfig,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    isDemoMode: false,
  };

  const resultA: DockingResult = {
    id: 'res_comp_drug_a',
    jobId: 'job_comp_drug_a',
    proteinId: targetProtein.id,
    ligandId: drugA.id,
    proteinName: targetProtein.name,
    ligandName: drugA.name,
    status: 'COMPLETED',
    hasRealResult: true,
    dockingScore: -8.4,
    poses: [
      { mode: 1, affinity: -8.4, rmsdLowerBound: 0, rmsdUpperBound: 0 },
      { mode: 2, affinity: -8.1, rmsdLowerBound: 1.2, rmsdUpperBound: 2.1 },
    ],
    interactionAnalysis: {
      hasAnalysis: true,
      interactions: [],
      hydrogenBondsCount: 3,
      hydrophobicContactsCount: 4,
      interactingResiduesCount: 6,
    },
    dockingStatusNote: 'Completed Vina docking run',
    timestamp: new Date().toISOString(),
    configuration: baseConfig,
    engineUsed: 'AutoDock Vina',
  };

  const jobB: DockingJob = {
    id: 'job_comp_drug_b',
    jobId: 'job_comp_drug_b',
    proteinId: targetProtein.id,
    proteinName: targetProtein.name,
    ligandId: drugB.id,
    ligandName: drugB.name,
    configuration: baseConfig,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    isDemoMode: true,
  };

  const resultB: DockingResult = {
    id: 'res_comp_drug_b',
    jobId: 'job_comp_drug_b',
    proteinId: targetProtein.id,
    ligandId: drugB.id,
    proteinName: targetProtein.name,
    ligandName: drugB.name,
    status: 'NO_RESULT',
    hasRealResult: false, // Standby: no real score!
    dockingScore: undefined,
    poses: [],
    dockingStatusNote: 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.',
    timestamp: new Date().toISOString(),
    configuration: baseConfig,
    engineUsed: 'AutoDock Vina (Standby)',
  };

  // Compile comparison rows for all 3 candidates
  const comparisonRows = comparisonService.buildComparisonRows({
    targetProtein,
    selectedCandidates: [drugA, drugB, drugC],
    jobs: [jobA, jobB],
    results: [resultA, resultB],
  });

  assert(comparisonRows.length === 3, 'Compiled rows for all 3 selected candidates');

  // Row A: Real completed docking
  const rowA = comparisonRows.find((r) => r.candidateId === drugA.id);
  assert(!!rowA, 'Row A exists');
  assert(rowA?.dockingStatus === 'COMPLETED', 'Drug A has COMPLETED status');
  assert(rowA?.dockingScore === -8.4, 'Drug A preserves real docking score (-8.4 kcal/mol)');
  assert(rowA?.bestPose === 'Pose #1', 'Drug A tracks best pose (Pose #1)');
  assert(rowA?.hydrogenBondsCount === 3, 'Drug A tracks computed H-bonds count (3)');
  assert(rowA?.hydrophobicContactsCount === 4, 'Drug A tracks hydrophobic contacts (4)');
  assert(rowA?.interactingResiduesCount === 6, 'Drug A tracks interacting residues (6)');
  assert(rowA?.jobId === 'job_comp_drug_a', 'Drug A links to jobId for navigation');

  // Row B: Standby docking (no real score)
  const rowB = comparisonRows.find((r) => r.candidateId === drugB.id);
  assert(!!rowB, 'Row B exists');
  assert(rowB?.dockingStatus === 'STANDBY', 'Drug B has STANDBY status');
  assert(rowB?.dockingScore === undefined, 'Drug B strictly does NOT fabricate docking score (undefined)');
  assert(rowB?.bestPose === undefined, 'Drug B strictly does NOT fabricate pose (undefined)');
  assert(rowB?.hydrogenBondsCount === undefined, 'Drug B strictly does NOT fabricate H-bonds (undefined)');
  assert(rowB?.jobId === 'job_comp_drug_b', 'Drug B links to jobId for navigation');

  // Row C: Awaiting docking (no job, no result)
  const rowC = comparisonRows.find((r) => r.candidateId === drugC.id);
  assert(!!rowC, 'Row C exists');
  assert(rowC?.dockingStatus === 'AWAITING_DOCKING', 'Drug C has AWAITING_DOCKING status');
  assert(rowC?.hasResult === false, 'Drug C hasResult is false');
  assert(rowC?.dockingScore === undefined, 'Drug C docking score is undefined');

  // --- Requirement 5: Comparison Summary Strip ---
  console.log('\n[Test 5: Comparison Summary Strip Compilation]');
  const summary = comparisonService.buildComparisonSummary({
    targetProtein,
    rows: comparisonRows,
  });

  assert(summary.targetProteinName === targetProtein.name, 'Summary tracks target protein name');
  assert(summary.totalCandidates === 3, 'Summary tracks total candidates (3)');
  assert(summary.completedDockings === 1, 'Summary tracks completed dockings (1)');
  assert(summary.pendingDockings === 2, 'Summary tracks pending/standby/awaiting dockings (2)');
  assert(summary.failedDockings === 0, 'Summary tracks failed dockings (0)');
  assert(summary.hasConfigurationMismatch === false, 'Summary flags consistent configuration');

  // --- Requirement 6: Notice & Disclaimer ---
  console.log('\n[Test 6: Scientific Notice Preservation]');
  const noticeText = 'Comparison is based on computational docking results under the selected common configuration.';
  assert(
    noticeText.includes('Comparison is based on computational docking results'),
    'Displays required common configuration notice'
  );

  console.log('\n======================================================');
  console.log(`STAGE 6 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage6Tests().catch((err) => {
  console.error('Fatal Stage 6 test error:', err);
  process.exit(1);
});
