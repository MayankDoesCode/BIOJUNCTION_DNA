/**
 * End-to-End Real Docking Verification with AutoDock Vina
 */

import { vinaBackend } from '../server/vinaBackend';
import { STRUCTURE_1HSG, LIGAND_1HSG_MK1 } from '../src/database/defaultStructures';

async function testRealDocking() {
  console.log('=================================================================');
  console.log('VERIFYING REAL AUTODOCK VINA SIMULATION EXECUTION');
  console.log('=================================================================\n');

  // 1. Verify executable detection
  const verification = vinaBackend.verifyExecutable();
  console.log(`[Step 1] Vina Binary Verification:`, verification);
  if (!verification.verified) {
    console.error('ERROR: AutoDock Vina binary not found or not executable.');
    process.exit(1);
  }

  // 2. Prepare payload with real PDBQT structures and valid search box
  // For 1HSG, center is around the active site: ~16.0, 25.0, 4.0
  const payload = {
    receptor: STRUCTURE_1HSG,
    ligand: LIGAND_1HSG_MK1,
    center_x: 16.0,
    center_y: 25.0,
    center_z: 4.0,
    size_x: 18.0,
    size_y: 18.0,
    size_z: 18.0,
    exhaustiveness: 2, // Small exhaustiveness for fast test execution
    num_modes: 3,
    energy_range: 3.0,
  };

  console.log('[Step 2] Validating scientific parameters...');
  const val = vinaBackend.validatePayload(payload);
  if (!val.isValid || !val.validated) {
    console.error('Validation failed:', val.error);
    process.exit(1);
  }
  console.log('Parameters successfully validated.');

  console.log('[Step 3] Executing real AutoDock Vina calculation (exhaustiveness=2)...');
  const startTime = Date.now();
  const response = await vinaBackend.executeDocking(val.validated);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Execution completed in ${elapsed}s.\n`);

  if (!response.success) {
    console.error('Docking calculation failed:', response);
    process.exit(1);
  }

  console.log('[Step 4] Execution Result Verification:');
  console.log(`- Job ID: ${response.jobId}`);
  console.log(`- Engine: ${response.engine.name} v${response.engine.version}`);
  console.log(`- Best Affinity: ${response.results.affinity} kcal/mol`);
  console.log(`- Output PDBQT Length: ${response.results.outputPdbqt.length} chars`);
  console.log(`- Poses Discovered: ${response.results.poses.length}`);

  response.results.poses.forEach((p, idx) => {
    console.log(`  * Pose ${idx + 1}: Score = ${p.score ?? p.affinity} kcal/mol, RMSD l.b. = ${p.rmsdLowerBound}, RMSD u.b. = ${p.rmsdUpperBound}`);
  });

  if (typeof response.results.affinity === 'number' && response.results.poses.length > 0) {
    console.log('\n✓ SUCCESS: Real AutoDock Vina execution and output parsing VERIFIED!');
  } else {
    console.error('\n✗ FAILED: Expected parsed scores and poses from real Vina execution.');
    process.exit(1);
  }
}

testRealDocking().catch((err) => {
  console.error('Unexpected error during real docking verification:', err);
  process.exit(1);
});
