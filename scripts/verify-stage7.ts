import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { proteinRepository } from '../src/database/repositories/proteinRepository';
import { ligandRepository } from '../src/database/repositories/ligandRepository';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import {
  dockingReportService,
  SCIENTIFIC_INTERPRETATION_TEXT,
  SCIENTIFIC_DISCLAIMER_TEXT,
  INTERACTION_UNAVAILABLE_TEXT,
  VISUALIZATION_APP_TEXT,
} from '../src/services/dockingReportService';
import type { DockingJob, DockingResult } from '../src/types';

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

async function runStage7Tests() {
  console.log('\n======================================================');
  console.log('STAGE 7: MOLECULAR DOCKING REPORT GENERATION & EXPORT');
  console.log('======================================================\n');

  // Seed baseline data
  const [proteins, ligands] = await Promise.all([
    proteinRepository.getAll(),
    ligandRepository.getAll(),
  ]);

  const targetProtein = proteins[0];
  const candidateLigand = ligands[0];
  const secondCandidate = ligands[1];

  console.log('1. Report Generation with Completed Docking Job');
  // Create a realistic completed docking job with parsed AutoDock Vina result
  const completedJobId = 'job_st7_completed_001';
  const completedJob: DockingJob = {
    id: completedJobId,
    jobId: completedJobId,
    proteinId: targetProtein.id,
    proteinName: targetProtein.name,
    ligandId: candidateLigand.id,
    ligandName: candidateLigand.name,
    status: 'COMPLETED',
    isDemoMode: false,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    configuration: {
      engine: 'AutoDock Vina',
      exhaustiveness: 8,
      numModes: 9,
      energyRange: 3.0,
      bindingSite: {
        name: 'Primary Catalytic Pocket',
        centerX: -10.5,
        centerY: 12.3,
        centerZ: 68.8,
        sizeX: 22.0,
        sizeY: 22.0,
        sizeZ: 22.0,
        spacing: 0.375,
      },
    },
  };
  await dockingRepository.createJob(completedJob);

  const completedResult: DockingResult = {
    id: 'res_st7_001',
    jobId: completedJobId,
    proteinId: targetProtein.id,
    ligandId: candidateLigand.id,
    proteinName: targetProtein.name,
    ligandName: candidateLigand.name,
    status: 'COMPLETED',
    hasRealResult: true,
    dockingScore: -8.4,
    dockingStatusNote: 'AutoDock Vina calculation finished with 9 modes.',
    timestamp: new Date().toISOString(),
    engineUsed: 'AutoDock Vina',
    configuration: completedJob.configuration,
    poses: [
      { mode: 1, affinity: -8.4, rmsdLowerBound: 0.0, rmsdUpperBound: 0.0 },
      { mode: 2, affinity: -7.8, rmsdLowerBound: 1.45, rmsdUpperBound: 2.12 },
      { mode: 3, affinity: -7.2, rmsdLowerBound: 2.31, rmsdUpperBound: 3.05 },
    ],
    interactionAnalysis: {
      hasAnalysis: true,
      interactions: [
        {
          id: 'int_1',
          type: 'HYDROGEN_BOND',
          proteinResidue: 'Cys',
          residueNumber: 145,
          chain: 'A',
          ligandAtom: 'O1',
          distance: 2.85,
          confidence: 0.95,
          description: 'H-Bond (O1 ••• N of Cys145)',
        },
        {
          id: 'int_2',
          type: 'HYDROPHOBIC',
          proteinResidue: 'His',
          residueNumber: 41,
          chain: 'A',
          ligandAtom: 'C3',
          distance: 3.65,
          confidence: 0.85,
          description: 'Hydrophobic contact (C3 ••• C of His41)',
        },
      ],
      hydrogenBondsCount: 1,
      hydrophobicContactsCount: 1,
      interactingResiduesCount: 2,
      analyzedAt: new Date().toISOString(),
      method: 'Geometric Euclidean Distance Analysis',
      statusNote: '2 contacts calculated from coordinates.',
    },
  };
  await dockingRepository.saveResult(completedResult);

  const report = await dockingReportService.generateReportFromJob(completedJobId);

  assert(!!report, 'Report generated successfully');
  assert(report.reportTitle === 'Molecular Docking Analysis Report', 'Correct report title');
  assert(report.jobId === completedJobId, 'Report links to actual Job ID');
  assert(report.targetProtein.name === targetProtein.name, 'Extracts actual target protein name');
  assert(report.candidateLigand.name === candidateLigand.name, 'Extracts actual candidate ligand name');

  console.log('\n2. Extraction of Docking Configuration');
  assert(report.dockingConfiguration.engine === 'AutoDock Vina', 'Extracts docking engine');
  assert(report.dockingConfiguration.exhaustiveness === 8, 'Extracts exhaustiveness parameter (8)');
  assert(report.dockingConfiguration.numModes === 9, 'Extracts numModes parameter (9)');
  assert(report.dockingConfiguration.energyRange === 3.0, 'Extracts energy range parameter (3.0 kcal/mol)');
  assert(
    report.dockingConfiguration.searchBoxCenter.x === -10.5 &&
    report.dockingConfiguration.searchBoxCenter.y === 12.3 &&
    report.dockingConfiguration.searchBoxCenter.z === 68.8,
    'Extracts exact search box center coordinates (-10.5, 12.3, 68.8)'
  );
  assert(
    report.dockingConfiguration.searchBoxSize.x === 22.0 &&
    report.dockingConfiguration.searchBoxSize.y === 22.0 &&
    report.dockingConfiguration.searchBoxSize.z === 22.0,
    'Extracts exact search box dimensions (22.0 x 22.0 x 22.0)'
  );

  console.log('\n3. Extraction of Docking Results and Poses');
  assert(report.dockingResults.status === 'COMPLETED', 'Docking status is COMPLETED');
  assert(report.dockingResults.hasCompletedResult === true, 'hasCompletedResult is true');
  assert(report.dockingResults.bestAffinity === -8.4, 'Extracts best affinity (-8.4 kcal/mol)');
  assert(report.dockingResults.bestAffinityDisplay === '-8.4 kcal/mol', 'Formats best affinity display string');
  assert(report.dockingResults.poseNumber === 1, 'Top pose mode is 1');
  assert(report.dockingResults.availablePoses.length === 3, 'Contains all 3 available poses');
  assert(report.dockingResults.availablePoses[1].affinity === -7.8, 'Pose 2 affinity is -7.8 kcal/mol');
  assert(report.dockingResults.availablePoses[1].rmsdLowerBound === 1.45, 'Pose 2 RMSD lower bound is 1.45 Å');

  console.log('\n4. Extraction of Actual Interaction Analysis Data');
  assert(report.interactionAnalysis.available === true, 'Interaction analysis is marked available');
  assert(report.interactionAnalysis.hydrogenBondsCount === 1, 'Extracts 1 hydrogen bond');
  assert(report.interactionAnalysis.hydrophobicContactsCount === 1, 'Extracts 1 hydrophobic contact');
  assert(report.interactionAnalysis.interactingResiduesCount === 2, 'Extracts 2 interacting residues');
  assert(report.interactionAnalysis.details?.length === 2, 'Contains 2 detailed interaction records');

  console.log('\n5. 3D Visualization Section');
  assert(
    report.visualizationNote === VISUALIZATION_APP_TEXT,
    'Contains exact required 3D visualization statement: "3D visualization is available in the interactive application."'
  );

  console.log('\n6. Scientific Interpretation & Scientific Disclaimer');
  assert(
    report.scientificInterpretation === SCIENTIFIC_INTERPRETATION_TEXT,
    'Contains concise scientific interpretation explaining computational predictions'
  );
  assert(
    report.scientificDisclaimer === SCIENTIFIC_DISCLAIMER_TEXT,
    'Prominently includes the exact required scientific disclaimer'
  );
  assert(
    !report.scientificInterpretation.toLowerCase().includes('cures') &&
    !report.scientificInterpretation.toLowerCase().includes('clinical effectiveness') &&
    !report.scientificInterpretation.toLowerCase().includes('guaranteed'),
    'Interpretation makes NO false clinical claims of cure or efficacy'
  );

  console.log('\n7. Missing Interaction Data Handling');
  // Create completed job without coordinates or interactions
  const noIntJobId = 'job_st7_no_int_002';
  const noIntJob: DockingJob = {
    id: noIntJobId,
    jobId: noIntJobId,
    proteinId: targetProtein.id,
    proteinName: targetProtein.name,
    ligandId: candidateLigand.id,
    ligandName: candidateLigand.name,
    status: 'COMPLETED',
    isDemoMode: true,
    createdAt: new Date().toISOString(),
    configuration: completedJob.configuration,
  };
  await dockingRepository.createJob(noIntJob);

  const noIntResult: DockingResult = {
    id: 'res_st7_no_int_002',
    jobId: noIntJobId,
    proteinId: targetProtein.id,
    ligandId: candidateLigand.id,
    proteinName: targetProtein.name,
    ligandName: candidateLigand.name,
    status: 'COMPLETED',
    hasRealResult: false,
    dockingStatusNote: 'Standby mode execution without atomic coordinates.',
    timestamp: new Date().toISOString(),
    engineUsed: 'AutoDock Vina',
    configuration: completedJob.configuration,
  };
  await dockingRepository.saveResult(noIntResult);

  const reportNoInt = await dockingReportService.generateReportFromJob(noIntJobId);
  assert(reportNoInt.interactionAnalysis.available === false, 'Interaction analysis is marked unavailable');
  assert(
    reportNoInt.interactionAnalysis.statusNote === INTERACTION_UNAVAILABLE_TEXT,
    'Displays exact message: "Interaction analysis is not available for this docking result."'
  );
  assert(reportNoInt.interactionAnalysis.hydrogenBondsCount === 0, 'Does not fabricate hydrogen bonds');
  assert(reportNoInt.interactionAnalysis.hydrophobicContactsCount === 0, 'Does not fabricate hydrophobic contacts');

  console.log('\n8. Rejection of Incomplete Docking Jobs');
  const runningJobId = 'job_st7_running_003';
  const runningJob: DockingJob = {
    id: runningJobId,
    jobId: runningJobId,
    proteinId: targetProtein.id,
    proteinName: targetProtein.name,
    ligandId: candidateLigand.id,
    ligandName: candidateLigand.name,
    status: 'RUNNING',
    isDemoMode: false,
    createdAt: new Date().toISOString(),
    configuration: completedJob.configuration,
  };
  await dockingRepository.createJob(runningJob);

  let rejectedRunning = false;
  let runningErrorMsg = '';
  try {
    await dockingReportService.generateReportFromJob(runningJobId);
  } catch (err: any) {
    rejectedRunning = true;
    runningErrorMsg = err.message;
  }
  assert(rejectedRunning, 'Rejects report generation for RUNNING job');
  assert(
    runningErrorMsg.includes('has not completed'),
    'Error message clearly explains job has not completed'
  );

  let rejectedMissing = false;
  try {
    await dockingReportService.generateReportFromJob('non_existent_job_999');
  } catch {
    rejectedMissing = true;
  }
  assert(rejectedMissing, 'Rejects report generation for non-existent job ID');

  console.log('\n9. Multiple-Candidate Comparison Report');
  const comparisonReport = await dockingReportService.generateComparisonReport({
    proteinId: targetProtein.id,
    candidateIds: [candidateLigand.id, secondCandidate.id],
  });

  assert(!!comparisonReport, 'Multi-candidate comparison report generated');
  assert(comparisonReport.isComparisonReport === true, 'isComparisonReport flag is true');
  assert(!!comparisonReport.comparisonData, 'Contains comparisonData object');
  assert(comparisonReport.comparisonData?.rows.length === 2, 'Contains rows for both candidates');
  assert(
    comparisonReport.comparisonData?.rows[0].candidateName === candidateLigand.name,
    'First row matches first candidate'
  );
  assert(
    !comparisonReport.scientificInterpretation.toLowerCase().includes('winner'),
    'Report does not declare a definitive clinical winner'
  );

  console.log('\n10. Professional PDF Generation & Export');
  const pdfExport = dockingReportService.exportReportToPDF(report, false);
  assert(!!pdfExport.doc, 'jsPDF document instance created');
  assert(
    pdfExport.filename.startsWith('molecular_docking_report_') && pdfExport.filename.endsWith('.pdf'),
    `Filename format matches molecular_docking_report_<report-id>.pdf (${pdfExport.filename})`
  );
  assert(pdfExport.arrayBuffer.byteLength > 1000, 'Exported PDF buffer has valid content size (> 1KB)');
  assert(pdfExport.doc.getNumberOfPages() >= 1, 'PDF has at least 1 formatted page');

  // Also test PDF export for comparison report
  const pdfCompExport = dockingReportService.exportReportToPDF(comparisonReport, false);
  assert(pdfCompExport.arrayBuffer.byteLength > 1000, 'Comparison PDF buffer has valid content size (> 1KB)');

  console.log('\n11. Report History Management');
  await dockingReportService.saveReportToHistory(report);
  const history = await dockingReportService.getReportHistory();
  assert(history.length >= 1, 'Report saved into history cache');
  assert(history[0].id === report.id, 'History item has matching Report ID');
  assert(history[0].jobId === completedJobId, 'History item has matching Job ID');
  assert(history[0].targetProtein === targetProtein.name, 'History item has target protein name');

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log('------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage7Tests().catch((err) => {
  console.error('Fatal error running Stage 7 tests:', err);
  process.exit(1);
});
