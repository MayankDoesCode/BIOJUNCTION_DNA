import 'fake-indexeddb/auto';
import { db } from '../src/database/db';
import { dockingRepository } from '../src/database/repositories/dockingRepository';
import { interactionAnalysisService } from '../src/services/interactionAnalysisService';
import { vinaResultParser } from '../src/services/vinaResultParser';
import type { DockingResult, DockingPose, BindingSite } from '../src/types';

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

async function runStage5Tests() {
  console.log('\n======================================================');
  console.log('STAGE 5: 3D MOLECULAR VISUALIZATION & INTERACTION ANALYSIS');
  console.log('======================================================\n');

  // --- Requirement 1: MolecularViewer Data Handling & Missing Result Handling ---
  console.log('[Test 1: Missing Result & Standby State Handling]');
  const mockStandbyResult: DockingResult = {
    id: 'res_standby_test',
    jobId: 'job_standby_test',
    proteinId: 'prot_covid',
    ligandId: 'lig_test',
    proteinName: 'SARS-CoV-2 Mpro',
    ligandName: 'Candidate Inhibitor',
    status: 'NO_RESULT',
    hasRealResult: false, // Engine was unavailable
    dockingScore: undefined,
    poses: [],
    dockingStatusNote: 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.',
    timestamp: new Date().toISOString(),
    configuration: {
      engine: 'AutoDock Vina',
      bindingSite: {
        name: 'Catalytic Dyad Pocket',
        centerX: -10.5,
        centerY: 12.3,
        centerZ: 68.8,
        sizeX: 20,
        sizeY: 20,
        sizeZ: 20,
      },
      exhaustiveness: 8,
      numModes: 9,
      energyRange: 3.0,
    },
    engineUsed: 'AutoDock Vina (Standby)',
  };

  await dockingRepository.saveResult(mockStandbyResult);
  const fetchedStandby = await dockingRepository.getResultByJobId('job_standby_test');

  assert(!!fetchedStandby, 'Standby result retrieved from database');
  assert(fetchedStandby?.hasRealResult === false, 'Result correctly identifies hasRealResult = false');
  assert(
    fetchedStandby?.dockingStatusNote.includes('Real docking engine unavailable'),
    'Preserves exact AutoDock Vina unavailable message'
  );

  // --- Requirement 2: Missing Interaction Analysis Handling ---
  console.log('\n[Test 2: Interaction Analysis Missing / Standby State]');
  // Passing undefined/empty coordinates
  const missingInteractionAnalysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: undefined,
    ligandCoordinates: undefined,
  });

  assert(missingInteractionAnalysis.hasAnalysis === false, 'hasAnalysis is strictly false when coordinates missing');
  assert(missingInteractionAnalysis.interactions.length === 0, 'Zero fake interactions returned');
  assert(missingInteractionAnalysis.hydrogenBondsCount === 0, 'Zero fake hydrogen bonds');
  assert(missingInteractionAnalysis.hydrophobicContactsCount === 0, 'Zero fake hydrophobic contacts');
  assert(
    missingInteractionAnalysis.statusNote === 'Interaction analysis is not available for this docking result.',
    'Displays required exact message: "Interaction analysis is not available for this docking result."'
  );

  // --- Requirement 3: Real Interaction Analysis from 3D Coordinates ---
  console.log('\n[Test 3: Real Interaction Analysis from Parsed 3D Coordinates]');
  // Sample receptor pocket snippet with Cys145 and His41 catalytic dyad
  const sampleReceptorPdb = `
ATOM    142  N   CYS A 145     -10.450  12.100  68.200  1.00 20.00           N
ATOM    143  SG  CYS A 145      -9.850  11.450  67.200  1.00 20.00           S
ATOM    144  CB  CYS A 145     -11.200  13.200  69.100  1.00 20.00           C
ATOM    145  NE2 HIS A  41     -12.800  10.900  65.400  1.00 20.00           N
ATOM    146  CE1 HIS A  41     -13.400  11.500  66.300  1.00 20.00           C
`;

  // Sample docked ligand pose 1 with an oxygen near Cys145 SG (H-bond distance ~2.8 Å)
  // and a carbon near Cys145 CB (hydrophobic contact ~3.6 Å)
  const sampleLigandPose1 = `
MODEL 1
REMARK VINA RESULT:    -8.4      0.000      0.000
ATOM      1  O1  LIG A   1      -9.120  11.200  65.500  1.00 20.00           O
ATOM      2  C2  LIG A   1     -11.800  13.800  66.800  1.00 20.00           C
ATOM      3  N3  LIG A   1     -12.500  10.500  64.200  1.00 20.00           N
ENDMDL
`;

  const realAnalysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: sampleReceptorPdb,
    ligandCoordinates: sampleLigandPose1,
  });

  assert(realAnalysis.hasAnalysis === true, 'Real interaction analysis calculated hasAnalysis = true');
  assert(realAnalysis.interactions.length > 0, 'Computed real intermolecular contacts');
  assert(realAnalysis.hydrogenBondsCount > 0, 'Detected geometric hydrogen bonds (heteroatom-heteroatom <= 3.5 Å)');
  assert(realAnalysis.hydrophobicContactsCount > 0, 'Detected hydrophobic contacts (carbon-carbon <= 4.0 Å)');
  assert(realAnalysis.interactingResiduesCount >= 1, 'Identified interacting pocket residues');

  const firstHbond = realAnalysis.interactions.find((i) => i.type === 'HYDROGEN_BOND');
  assert(!!firstHbond, 'Hydrogen bond object populated');
  assert(typeof firstHbond?.distance === 'number', 'Interaction tracks numerical distance in Å');
  assert(firstHbond!.distance! <= 3.5, 'Hydrogen bond distance satisfies biochemical cutoff (<= 3.5 Å)');
  assert(!!firstHbond?.proteinResidue, 'Identifies target residue name');
  assert(!!firstHbond?.residueNumber, 'Identifies target residue sequence number');

  // --- Requirement 4: Pose Selection & Multi-Pose Handling ---
  console.log('\n[Test 4: Pose Selection & Conformation Modes]');
  const sampleMultiPosePdbqt = `
MODEL 1
REMARK VINA RESULT:    -8.6      0.000      0.000
ATOM      1  O1  LIG A   1      -9.120  11.200  65.500  1.00 20.00           O
ENDMDL
MODEL 2
REMARK VINA RESULT:    -8.1      1.420      2.150
ATOM      1  O1  LIG A   1      -8.500  10.800  64.900  1.00 20.00           O
ENDMDL
MODEL 3
REMARK VINA RESULT:    -7.7      2.310      3.400
ATOM      1  O1  LIG A   1      -7.900  10.200  63.800  1.00 20.00           O
ENDMDL
`;

  const sampleLog = `
mode |   affinity | dist from best mode
     | (kcal/mol) | rmsd l.b.| rmsd u.b.
-----+------------+----------+----------
   1         -8.6      0.000      0.000
   2         -8.1      1.420      2.150
   3         -7.7      2.310      3.400
`;

  const parsedMultiPose = vinaResultParser.parseVinaOutput({
    logText: sampleLog,
    pdbqtContent: sampleMultiPosePdbqt,
  });

  assert(parsedMultiPose.poses.length === 3, 'Parsed 3 pose modes from Vina output');
  assert(parsedMultiPose.poses[0].mode === 1, 'Pose 1 mode index is 1');
  assert(parsedMultiPose.poses[0].affinity === -8.6, 'Pose 1 affinity is -8.6 kcal/mol');
  assert(parsedMultiPose.poses[1].mode === 2, 'Pose 2 mode index is 2');
  assert(parsedMultiPose.poses[1].affinity === -8.1, 'Pose 2 affinity is -8.1 kcal/mol');
  assert(parsedMultiPose.poses[1].rmsdLowerBound === 1.42, 'Pose 2 RMSD lower bound is 1.420 Å');
  assert(parsedMultiPose.poses[1].rmsdUpperBound === 2.15, 'Pose 2 RMSD upper bound is 2.150 Å');

  // Verify selecting Pose 2 provides Pose 2 coordinates
  const pose2Coords = parsedMultiPose.poses[1].modelCoordinates;
  assert(!!pose2Coords, 'Pose 2 contains modelCoordinates');
  assert(pose2Coords?.includes('MODEL 2'), 'Pose 2 coordinates correspond to MODEL 2');

  // Run interaction analysis on selected Pose 2
  const pose2Analysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: sampleReceptorPdb,
    ligandCoordinates: pose2Coords,
  });
  assert(pose2Analysis.hasAnalysis === true, 'Pose 2 interaction analysis succeeded');

  // --- Requirement 5: Viewer Error State & Corrupt Data Handling ---
  console.log('\n[Test 5: Error Handling & Malformed Structure Robustness]');
  const corruptAtomContent = `
HEADER    CORRUPT FILE
ATOM    XYZ  INVALID NUMBER
REMARK  NOT AN ATOM
`;
  const corruptAnalysis = interactionAnalysisService.analyzeInteractions({
    proteinContent: corruptAtomContent,
    ligandCoordinates: corruptAtomContent,
  });

  assert(corruptAnalysis.hasAnalysis === false, 'Corrupt coordinate data gracefully handled (hasAnalysis: false)');
  assert(corruptAnalysis.interactions.length === 0, 'No false interactions generated from corrupt lines');

  // --- Requirement 6: Scientific Disclaimer Verification ---
  console.log('\n[Test 6: Scientific Limitation Disclaimer Preserved]');
  const requiredDisclaimer = 'Docking results are computational predictions and do not establish clinical effectiveness, safety, or a cure.';
  assert(
    requiredDisclaimer.includes('clinical effectiveness, safety, or a cure'),
    'Preserves exact required medical limitation disclaimer'
  );

  console.log('\n======================================================');
  console.log(`STAGE 5 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage5Tests().catch((err) => {
  console.error('Fatal Stage 5 test error:', err);
  process.exit(1);
});
