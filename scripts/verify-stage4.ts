import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { proteinRepository } from '../src/database/repositories/proteinRepository';
import { ligandRepository } from '../src/database/repositories/ligandRepository';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import { inputPreparationService } from '../src/services/inputPreparationService';
import { vinaResultParser } from '../src/services/vinaResultParser';
import { dockingService } from '../src/services/dockingService';
import type { Protein, Ligand, BindingSite, DockingConfiguration } from '../src/types';

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

async function runStage4Tests() {
  console.log('\n======================================================');
  console.log('STAGE 4: DOCKING ENGINE INTEGRATION TEST SUITE');
  console.log('======================================================\n');

  // --- Requirement 1: Engine Environment Inspection ---
  console.log('[Test 1: AutoDock Vina Environment & Availability Check]');
  const engineStatus = await dockingService.checkEngineStatus();
  assert(engineStatus.isAvailable === false, 'AutoDock Vina is correctly detected as unavailable in host environment');
  assert(
    engineStatus.message === 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.',
    'Displays required exact unavailable message'
  );
  assert(engineStatus.setupRequirements.length >= 3, 'Provides clear actionable setup requirements');
  assert(engineStatus.mode === 'DEMO_STANDBY', 'Sets execution mode to DEMO_STANDBY');

  // --- Requirement 2 & 3: Input Preparation Pipeline ---
  console.log('\n[Test 2: Input Preparation Pipeline - Valid Inputs]');
  const testProtein: Protein = {
    id: 'prot_covid_mpro',
    name: 'SARS-CoV-2 Main Protease',
    structureId: '6LU7',
    source: 'RCSB Protein Data Bank',
    fileFormat: 'PDBQT',
    organism: 'SARS-CoV-2',
    resolution: '2.16 Å',
    status: 'READY',
    uploadDate: new Date().toISOString(),
  };

  const testLigand: Ligand = {
    id: 'lig_test_inhibitor',
    name: 'Candidate Protease Inhibitor Alpha',
    chemicalName: 'N-[(2S)-1-({(2S)-1-amino-4-methyl-1-oxopentan-2-yl}amino)-1-oxo-3-phenylpropan-2-yl]benzamide',
    formula: 'C28H31N3O4',
    molecularWeight: 473.56,
    fileFormat: 'PDBQT',
    isDemo: false,
    status: 'READY',
    uploadDate: new Date().toISOString(),
  };

  const testBindingSite: BindingSite = {
    name: 'Catalytic Dyad Pocket',
    description: 'Cys145 and His41 catalytic center',
    centerX: -10.5,
    centerY: 12.3,
    centerZ: 68.8,
    sizeX: 20.0,
    sizeY: 20.0,
    sizeZ: 20.0,
    spacing: 0.375,
  };

  const prepValid = inputPreparationService.prepareDockingInput(testProtein, testLigand, testBindingSite);
  assert(prepValid.isValid === true, 'Valid protein + ligand + binding site successfully prepared');
  assert(prepValid.proteinFormat === 'PDBQT', 'Protein format validated as PDBQT');
  assert(prepValid.ligandFormat === 'PDBQT', 'Ligand format validated as PDBQT');
  assert(prepValid.configuration.exhaustiveness === 8, 'Default exhaustiveness set to 8');
  assert(prepValid.configuration.numModes === 9, 'Default numModes set to 9');

  // --- Requirement 3b: Input Preparation - Missing Protein ---
  console.log('\n[Test 3: Missing Protein Validation]');
  const prepMissingProt = inputPreparationService.prepareDockingInput(null, testLigand, testBindingSite);
  assert(prepMissingProt.isValid === false, 'Missing protein correctly marked invalid');
  assert(
    prepMissingProt.validationErrors.some((e) => e.includes('Target protein receptor is required')),
    'Missing protein error message present'
  );

  // --- Requirement 3c: Input Preparation - Missing Ligand ---
  console.log('\n[Test 4: Missing Ligand Validation]');
  const prepMissingLig = inputPreparationService.prepareDockingInput(testProtein, null, testBindingSite);
  assert(prepMissingLig.isValid === false, 'Missing ligand correctly marked invalid');
  assert(
    prepMissingLig.validationErrors.some((e) => e.includes('Candidate molecule ligand is required')),
    'Missing ligand error message present'
  );

  // --- Requirement 3d: Input Preparation - Invalid Binding Region ---
  console.log('\n[Test 5: Invalid Binding Search Region Validation]');
  const invalidSiteCoords: BindingSite = {
    name: '',
    centerX: NaN,
    centerY: 0,
    centerZ: 0,
    sizeX: -10,
    sizeY: 0,
    sizeZ: 85, // Exceeds 60 Å max dimension
  };
  const prepInvalidSite = inputPreparationService.prepareDockingConfiguration(invalidSiteCoords);
  assert(prepInvalidSite.isValid === false, 'Invalid binding region coordinates correctly rejected');
  assert(prepInvalidSite.errors.length >= 3, 'Multiple boundary violations captured');
  assert(
    prepInvalidSite.errors.some((e) => e.includes('60.0 Å')),
    'Catches search volume dimension upper limit (> 60 Å)'
  );

  // --- Requirement 4: Docking Job Lifecycle & Tracking ---
  console.log('\n[Test 6: Docking Job Tracking & Lifecycle]');
  const statusesTracked: string[] = [];
  const submission = await dockingService.submitDockingJob({
    protein: testProtein,
    ligand: testLigand,
    bindingSite: testBindingSite,
    notes: 'Integration test job',
    onProgress: (status) => {
      statusesTracked.push(status);
    },
  });

  assert(!!submission.job.jobId, 'Docking job created with unique jobId');
  assert(submission.job.proteinId === testProtein.id, 'Job tracks proteinId');
  assert(submission.job.ligandId === testLigand.id, 'Job tracks ligandId');
  assert(!!submission.job.configuration, 'Job tracks configuration');
  assert(!!submission.job.createdAt, 'Job tracks createdAt timestamp');
  assert(submission.job.status === 'COMPLETED', 'Job completed in standby mode');
  assert(statusesTracked.includes('PREPARING'), 'Job passed through PREPARING status');
  assert(statusesTracked.includes('QUEUED'), 'Job passed through QUEUED status');
  assert(statusesTracked.includes('RUNNING'), 'Job passed through RUNNING status');

  // Verify DB persistence of Job
  const persistedJob = await dockingRepository.getJobById(submission.job.jobId);
  assert(!!persistedJob, 'Docking job stored in Dexie database');
  assert(persistedJob?.jobId === submission.job.jobId, 'Job retrieved by jobId');

  // --- Requirement 5 & 8: Scientific Integrity - No Fake Results when Engine Unavailable ---
  console.log('\n[Test 7: Scientific Integrity & Unavailable Engine State]');
  assert(submission.result.hasRealResult === false, 'Strictly marks hasRealResult = false');
  assert(submission.result.dockingScore === undefined, 'Does NOT generate synthetic docking score');
  assert(
    submission.result.dockingStatusNote === 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.',
    'Displays required unavailable notice in result'
  );
  assert(
    submission.result.outputFiles?.some((f) => f.name.includes('config.txt')),
    'Prepared configuration output file recorded'
  );

  // --- Requirement 7: Failed Docking Validation ---
  console.log('\n[Test 8: Failed Docking Handling]');
  let caughtError = false;
  try {
    // Attempt submission with invalid input
    await dockingService.submitDockingJob({
      protein: null as any,
      ligand: testLigand,
      bindingSite: testBindingSite,
    });
  } catch (err) {
    caughtError = true;
  }
  assert(caughtError === true, 'submitDockingJob throws on invalid inputs without creating fake success');

  // --- Requirement 6: AutoDock Vina Output Parser ---
  console.log('\n[Test 9: AutoDock Vina Output Parser - Log & PDBQT]');
  const sampleVinaLog = `
AutoDock Vina v1.2.5
#################################################################
# If you used AutoDock Vina in your work, please cite:          #
# O. Trott, A. J. Olson, AutoDock Vina: improving the speed     #
#################################################################

Reading input ... done.
Setting up the grid ... done.
Grid bounds:
    min: (-20.5, 2.3, 58.8)
    max: (-0.5, 22.3, 78.8)
    center: (-10.5, 12.3, 68.8)
    size: (20.0, 20.0, 20.0)

Performing search ... done.
Refining results ... done.

mode |   affinity | dist from best mode
     | (kcal/mol) | rmsd l.b.| rmsd u.b.
-----+------------+----------+----------
   1         -8.4      0.000      0.000
   2         -8.1      1.342      2.105
   3         -7.9      2.045      3.412
   4         -7.4      2.880      4.120
Writing output ... done.
`;

  const samplePdbqt = `
MODEL 1
REMARK VINA RESULT:    -8.4      0.000      0.000
ATOM      1  N   LIG A   1      -9.120  11.450  67.120  1.00 20.00     0.150 N 
ATOM      2  CA  LIG A   1      -8.450  12.320  68.040  1.00 20.00     0.080 C 
ENDMDL
MODEL 2
REMARK VINA RESULT:    -8.1      1.342      2.105
ATOM      1  N   LIG A   1      -9.450  11.890  66.980  1.00 20.00     0.150 N 
ENDMDL
`;

  const parsed = vinaResultParser.parseVinaOutput({
    logText: sampleVinaLog,
    pdbqtContent: samplePdbqt,
  });

  assert(parsed.isValid === true, 'Vina parser successfully parsed output files');
  assert(parsed.dockingScore === -8.4, 'Extracted top docking score: -8.4 kcal/mol');
  assert(parsed.poses.length === 4, 'Parsed 4 pose modes from log table');
  assert(parsed.poses[0].affinity === -8.4, 'Mode 1 affinity is -8.4 kcal/mol');
  assert(parsed.poses[1].affinity === -8.1, 'Mode 2 affinity is -8.1 kcal/mol');
  assert(parsed.poses[1].rmsdLowerBound === 1.342, 'Mode 2 RMSD l.b. parsed correctly (1.342)');
  assert(parsed.poses[1].rmsdUpperBound === 2.105, 'Mode 2 RMSD u.b. parsed correctly (2.105)');
  assert(parsed.poses[0].modelCoordinates?.includes('ATOM      1  N'), 'Model 1 coordinates parsed from PDBQT');
  assert(parsed.poses[1].modelCoordinates?.includes('ATOM      1  N'), 'Model 2 coordinates parsed from PDBQT');

  // Test parser error handling on invalid text
  const invalidParse = vinaResultParser.parseVinaOutput({
    logText: 'AutoDock Vina error: Could not open receptor file.',
  });
  assert(invalidParse.isValid === false, 'Parser detects error output from Vina');
  assert(invalidParse.poses.length === 0, 'No fake poses created on error log');

  // --- Requirement 10: Results Retrieval by Job ID ---
  console.log('\n[Test 10: Results Page Ledger & Retrieval by Job ID]');
  const retrievedResult = await dockingRepository.getResultByJobId(submission.job.jobId);
  assert(!!retrievedResult, 'Result record successfully retrieved using jobId');
  assert(retrievedResult?.jobId === submission.job.jobId, 'Result matches requested jobId');

  console.log('\n======================================================');
  console.log(`STAGE 4 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage4Tests().catch((err) => {
  console.error('Fatal Stage 4 test error:', err);
  process.exit(1);
});
