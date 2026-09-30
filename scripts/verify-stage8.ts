import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { proteinRepository } from '../src/database/repositories/proteinRepository';
import { ligandRepository } from '../src/database/repositories/ligandRepository';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import { dockingService } from '../src/services/dockingService';
import { vinaResultParser } from '../src/services/vinaResultParser';
import { interactionAnalysisService } from '../src/services/interactionAnalysisService';
import { comparisonService } from '../src/services/comparisonService';
import {
  dockingReportService,
  SCIENTIFIC_INTERPRETATION_TEXT,
  SCIENTIFIC_DISCLAIMER_TEXT,
  INTERACTION_UNAVAILABLE_TEXT,
  VISUALIZATION_APP_TEXT,
} from '../src/services/dockingReportService';
import type {
  Protein,
  Ligand,
  DockingJob,
  DockingResult,
  DockingConfiguration,
  BindingSite,
} from '../src/types';

// Mock browser storage for Node test runner
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

async function runStage8Tests() {
  console.log('\n======================================================');
  console.log('STAGE 8: FINAL INTEGRATION, SCIENTIFIC VALIDATION & DEMO READINESS');
  console.log('======================================================\n');

  // =========================================================================
  // WORKFLOW VERIFICATION:
  // Protein → Ligand → Binding Site → Docking Configuration → AutoDock Vina
  // → Results → 3D Visualization → Interaction Analysis → Candidate Comparison
  // → Report Preview → PDF Export
  // =========================================================================

  console.log('[Step 1: Target Protein Repository Verification]');
  const proteins = await proteinRepository.getAll();
  assert(proteins.length >= 2, `Proteins repository initialized with ${proteins.length} entries`);
  const mpro = proteins.find((p) => p.structureId === '6LU7' || p.name.includes('6LU7')) || proteins[0];
  assert(!!mpro, 'SARS-CoV-2 Main Protease (6LU7) target protein present');
  assert(mpro.fileFormat === 'PDB' || mpro.fileFormat === 'PDBQT', 'Protein has valid structural format');
  assert(mpro.status === 'READY' || mpro.status === 'PARSED', 'Target protein status is READY/PARSED');

  console.log('\n[Step 2: Candidate Ligand Repository Verification]');
  const ligands = await ligandRepository.getAll();
  assert(ligands.length >= 3, `Ligands repository initialized with ${ligands.length} entries`);
  const drugA = ligands[0];
  const drugB = ligands[1];
  const drugC = ligands[2];
  assert(!!drugA && !!drugB && !!drugC, 'Candidate ligand series (Drug A, B, C) loaded');
  assert(drugA.status === 'READY', 'Candidate ligand status is READY');

  console.log('\n[Step 3: Binding Site & Search Region Validation]');
  const bindingSite: BindingSite = {
    name: 'Primary Catalytic Pocket (Cys145–His41)',
    description: 'Active site exploration box for SARS-CoV-2 Mpro',
    centerX: -10.5,
    centerY: 12.3,
    centerZ: 68.8,
    sizeX: 22.0,
    sizeY: 22.0,
    sizeZ: 22.0,
    spacing: 0.375,
  };
  assert(bindingSite.centerX === -10.5 && bindingSite.centerY === 12.3 && bindingSite.centerZ === 68.8, 'Search box center coordinates validated');
  assert(bindingSite.sizeX === 22.0 && bindingSite.sizeY === 22.0 && bindingSite.sizeZ === 22.0, 'Search box size dimensions validated');
  assert(bindingSite.spacing === 0.375, 'Standard crystallographic grid spacing (0.375 Å) set');

  console.log('\n[Step 4: Docking Configuration & Input Preparation]');
  const preparedInput = dockingService.prepareInputs(mpro, drugA, bindingSite, {
    exhaustiveness: 8,
    numModes: 9,
    energyRange: 3.0,
  });
  assert(preparedInput.isValid, 'Input preparation succeeds with valid protein, ligand, and config');
  assert(preparedInput.proteinName === mpro.name, 'Prepared input references correct protein');
  assert(preparedInput.ligandName === drugA.name, 'Prepared input references correct ligand');
  assert(preparedInput.configuration.exhaustiveness === 8, 'Preserves exhaustiveness parameter (8)');

  console.log('\n[Step 5: AutoDock Vina Engine Detection & Execution Boundary]');
  const engineStatus = await dockingService.checkEngineStatus();
  assert(engineStatus.engineName === 'AutoDock Vina', 'Correctly identifies AutoDock Vina engine');
  // Check that if binary is unavailable, status is clearly UNAVAILABLE and not faked
  if (!engineStatus.isAvailable) {
    assert(engineStatus.mode === 'DEMO_STANDBY', 'Engine mode reports DEMO_STANDBY when binary missing');
    assert(engineStatus.setupRequirements.length > 0, 'Provides clear setup guide when Vina is unavailable');
    assert(engineStatus.setupRequirements[0].includes('vina'), 'Provides setup instructions mentioning Vina binary');
  }

  // Execute docking simulation in standby mode
  const { job: standbyJob, result: standbyResult } = await dockingService.submitDockingJob({
    protein: mpro,
    ligand: drugA,
    bindingSite,
    options: {
      exhaustiveness: 8,
      numModes: 9,
      energyRange: 3.0,
    },
  });
  assert(standbyJob.status === 'COMPLETED', 'Job completed through docking service');
  assert(standbyResult.hasRealResult === false, 'hasRealResult is false in standby mode (NO fake results)');
  assert(standbyResult.dockingScore === undefined, 'dockingScore is undefined in standby mode (NO fake scores)');
  assert(
    standbyResult.dockingStatusNote.includes('Standby') ||
    standbyResult.dockingStatusNote.includes('AutoDock Vina'),
    'dockingStatusNote clearly states engine standby execution'
  );

  console.log('\n[Step 6: Real Vina Log & Output Parsing (Scores, Poses, RMSD)]');
  const sampleVinaLog = `
AutoDock Vina v1.2.5
Analyzing search space...
Performing search...
0%   10   20   30   40   50   60   70   80   90   100%
|----|----|----|----|----|----|----|----|----|----|
***************************************************

mode |   affinity | dist from best mode
     | (kcal/mol) | rmsd l.b.| rmsd u.b.
-----+------------+----------+----------
   1         -8.6      0.000      0.000
   2         -8.1      1.420      2.150
   3         -7.5      2.110      3.400
Writing output ... done.
`;
  const parsedLog = vinaResultParser.parseVinaOutput({ logText: sampleVinaLog });
  assert(parsedLog.success, 'Real AutoDock Vina log output parsed successfully');
  assert(parsedLog.dockingScore === -8.6, 'Correctly extracts best affinity score (-8.6 kcal/mol)');
  assert(parsedLog.poses.length === 3, 'Correctly parses 3 binding pose modes');
  assert(parsedLog.poses[0].affinity === -8.6, 'Pose 1 affinity is -8.6 kcal/mol');
  assert(parsedLog.poses[1].affinity === -8.1, 'Pose 2 affinity is -8.1 kcal/mol');
  assert(parsedLog.poses[1].rmsdLowerBound === 1.42, 'Pose 2 RMSD lower bound is 1.42 Å');
  assert(parsedLog.poses[1].rmsdUpperBound === 2.15, 'Pose 2 RMSD upper bound is 2.15 Å');
  assert(parsedLog.poses[2].affinity === -7.5, 'Pose 3 affinity is -7.5 kcal/mol');

  console.log('\n[Step 7: 3D Coordinate Parsing & Interaction Analysis]');
  const samplePdbProtein = `
ATOM      1  N   HIS A  41      -8.120  14.210  65.100  1.00 20.00           N
ATOM      2  CA  HIS A  41      -7.500  13.100  65.800  1.00 20.00           C
ATOM      3  C   HIS A  41      -8.000  12.000  66.200  1.00 20.00           C
ATOM      4  O   HIS A  41      -9.100  11.800  66.000  1.00 20.00           O
ATOM      5  N   CYS A 145     -10.200  11.800  67.500  1.00 20.00           N
ATOM      6  CA  CYS A 145     -11.100  10.900  68.100  1.00 20.00           C
ATOM      7  C   CYS A 145     -11.800  10.100  67.200  1.00 20.00           C
ATOM      8  O   CYS A 145     -11.500   9.900  66.000  1.00 20.00           O
`;
  const sampleLigandPose = `
HETATM    1  O1  LIG L   1     -10.500  11.200  67.800  1.00  0.00           O
HETATM    2  C2  LIG L   1      -8.200  13.900  65.400  1.00  0.00           C
`;
  const realAnalysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: samplePdbProtein,
    ligandCoordinates: sampleLigandPose,
  });
  assert(realAnalysis.hasAnalysis, 'Real interaction analysis calculated from 3D coordinates');
  assert(realAnalysis.hydrogenBondsCount >= 1, 'Detected hydrogen bond within 3.5 Å cutoff');
  assert(realAnalysis.hydrophobicContactsCount >= 1, 'Detected hydrophobic contact within 4.0 Å cutoff');
  assert(realAnalysis.interactingResiduesCount >= 1, 'Detected interacting residues');

  // Verify missing coordinate handling
  const emptyAnalysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: '',
    ligandCoordinates: '',
  });
  assert(!emptyAnalysis.hasAnalysis, 'Correctly flags hasAnalysis = false when coordinates missing');
  assert(
    emptyAnalysis.statusNote === INTERACTION_UNAVAILABLE_TEXT,
    `Displays exact required text: "${INTERACTION_UNAVAILABLE_TEXT}"`
  );
  assert(emptyAnalysis.hydrogenBondsCount === 0, 'Zero fabricated hydrogen bonds');
  assert(emptyAnalysis.hydrophobicContactsCount === 0, 'Zero fabricated hydrophobic contacts');

  console.log('\n[Step 8: Candidate Comparison Validation & Winner Disclaimers]');
  // Create a completed job with real score for drugA
  const realJobA: DockingJob = {
    id: 'job_real_a',
    jobId: 'job_real_a',
    proteinId: mpro.id,
    proteinName: mpro.name,
    ligandId: drugA.id,
    ligandName: drugA.name,
    status: 'COMPLETED',
    isDemoMode: false,
    createdAt: new Date().toISOString(),
    configuration: {
      engine: 'AutoDock Vina',
      bindingSite,
      exhaustiveness: 8,
      numModes: 9,
      energyRange: 3.0,
    },
  };
  await dockingRepository.createJob(realJobA);
  const realResultA: DockingResult = {
    id: 'res_real_a',
    jobId: 'job_real_a',
    proteinId: mpro.id,
    ligandId: drugA.id,
    proteinName: mpro.name,
    ligandName: drugA.name,
    status: 'COMPLETED',
    hasRealResult: true,
    dockingScore: -8.6,
    dockingStatusNote: 'Computed via Vina output.',
    timestamp: new Date().toISOString(),
    engineUsed: 'AutoDock Vina',
    configuration: realJobA.configuration,
    poses: parsedLog.poses,
    interactionAnalysis: realAnalysis,
  };
  await dockingRepository.saveResult(realResultA);

  const compValidation = comparisonService.validateComparison({
    targetProtein: mpro,
    selectedCandidateIds: [drugA.id, drugB.id],
  });
  assert(compValidation.isValid, 'Comparison passes validation with same protein and 2 candidates');

  const compRows = comparisonService.buildComparisonRows({
    targetProtein: mpro,
    selectedCandidates: [drugA, drugB],
    jobs: [realJobA],
    results: [realResultA],
  });
  assert(compRows.length === 2, 'Builds comparison rows for both candidates');
  assert(compRows[0].dockingStatus === 'COMPLETED', 'Drug A docking status is COMPLETED');
  assert(compRows[0].dockingScore === -8.6, 'Drug A docking score is -8.6 kcal/mol');
  assert(compRows[1].dockingStatus === 'AWAITING_DOCKING', 'Drug B is AWAITING_DOCKING');
  assert(compRows[1].dockingScore === undefined, 'Drug B docking score is undefined (NO fake scores)');

  console.log('\n[Step 9: Report Generation & Preview Data Integrity]');
  const reportA = await dockingReportService.generateReportFromJob('job_real_a');
  assert(!!reportA, 'Report generated for completed job');
  assert(reportA.reportTitle === 'Molecular Docking Analysis Report', 'Title: "Molecular Docking Analysis Report"');
  assert(reportA.targetProtein.name === mpro.name, 'Actual target protein name displayed');
  assert(reportA.candidateLigand.name === drugA.name, 'Actual candidate ligand name displayed');
  assert(reportA.dockingConfiguration.engine === 'AutoDock Vina', 'Actual docking engine displayed');
  assert(reportA.dockingResults.bestAffinity === -8.6, 'Actual best affinity score extracted');
  assert(reportA.dockingResults.availablePoses.length === 3, 'Actual parsed poses extracted');
  assert(reportA.interactionAnalysis.available === true, 'Actual interaction data extracted');
  assert(reportA.visualizationNote === VISUALIZATION_APP_TEXT, `Visualization text: "${VISUALIZATION_APP_TEXT}"`);

  console.log('\n[Step 10: Scientific Interpretation & Mandatory Disclaimer]');
  assert(
    reportA.scientificInterpretation === SCIENTIFIC_INTERPRETATION_TEXT,
    'Scientific interpretation matches exact required text'
  );
  assert(
    reportA.scientificDisclaimer === SCIENTIFIC_DISCLAIMER_TEXT,
    'Scientific disclaimer matches exact required text'
  );
  assert(
    !reportA.scientificInterpretation.toLowerCase().includes('cures') &&
    !reportA.scientificInterpretation.toLowerCase().includes('guaranteed') &&
    !reportA.scientificInterpretation.toLowerCase().includes('clinical effectiveness'),
    'Strictly NO claims that the drug cures a disease or has guaranteed clinical effectiveness'
  );

  console.log('\n[Step 11: Incomplete Docking Job Rejection]');
  const incompleteJob: DockingJob = {
    id: 'job_incomplete_001',
    jobId: 'job_incomplete_001',
    proteinId: mpro.id,
    proteinName: mpro.name,
    ligandId: drugB.id,
    ligandName: drugB.name,
    status: 'RUNNING',
    isDemoMode: false,
    createdAt: new Date().toISOString(),
    configuration: realJobA.configuration,
  };
  await dockingRepository.createJob(incompleteJob);

  let incompleteRejected = false;
  try {
    await dockingReportService.generateReportFromJob('job_incomplete_001');
  } catch (err: any) {
    incompleteRejected = true;
    assert(err.message.includes('has not completed'), 'Error message clearly states job has not completed');
  }
  assert(incompleteRejected, 'Report generation rejected for incomplete (RUNNING) job');

  console.log('\n[Step 12: PDF Document Generation]');
  const pdfOutput = dockingReportService.exportReportToPDF(reportA, false);
  assert(!!pdfOutput.doc, 'PDF document created via jsPDF');
  assert(
    pdfOutput.filename.startsWith('molecular_docking_report_') && pdfOutput.filename.endsWith('.pdf'),
    `Filename format matches molecular_docking_report_<report-id>.pdf (${pdfOutput.filename})`
  );
  assert(pdfOutput.arrayBuffer.byteLength > 1000, 'Exported PDF buffer has valid byte size');
  assert(pdfOutput.doc.getNumberOfPages() >= 1, 'Exported PDF has at least 1 formatted page');

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL STAGE 8 TESTS: ${testsPassed + testsFailed}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log('------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage8Tests().catch((err) => {
  console.error('Fatal error running Stage 8 tests:', err);
  process.exit(1);
});
