/**
 * Verify HTTP API Endpoints on Local Dev Server
 */

import { STRUCTURE_1HSG, LIGAND_1HSG_MK1 } from '../src/database/defaultStructures';

async function testApiEndpoints() {
  console.log('Testing /api/docking-status...');
  const statusRes = await fetch('http://localhost:3000/api/docking-status');
  if (!statusRes.ok) {
    throw new Error(`Failed to GET /api/docking-status: HTTP ${statusRes.status}`);
  }
  const status = await statusRes.json();
  console.log('Status Response:', status);

  if (!status.available) {
    throw new Error('Expected engine to be available on local server');
  }

  console.log('\nTesting POST /api/docking...');
  const dockRes = await fetch('http://localhost:3000/api/docking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receptor: STRUCTURE_1HSG,
      ligand: LIGAND_1HSG_MK1,
      center_x: 16.0,
      center_y: 25.0,
      center_z: 4.0,
      size_x: 16.0,
      size_y: 16.0,
      size_z: 16.0,
      exhaustiveness: 1,
      num_modes: 2,
      energy_range: 3.0,
    }),
  });

  if (!dockRes.ok) {
    const errText = await dockRes.text();
    throw new Error(`Failed POST /api/docking: HTTP ${dockRes.status}: ${errText}`);
  }

  const result = await dockRes.json();
  console.log('Docking Response Success:', result.success);
  console.log('Engine:', result.engine);
  console.log('Affinity:', result.results?.affinity);
  console.log('Poses count:', result.results?.poses?.length);

  if (result.success && result.results?.poses?.length > 0) {
    console.log('\n✓ SUCCESS: Both /api/docking-status and /api/docking HTTP endpoints VERIFIED!');
  } else {
    throw new Error('API docking response invalid');
  }
}

testApiEndpoints().catch((err) => {
  console.error('API Verification failed:', err);
  process.exit(1);
});
