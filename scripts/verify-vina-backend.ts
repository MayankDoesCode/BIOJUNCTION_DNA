import { vinaBackendService } from '../server/vinaBackend';

console.log('Testing AutoDock Vina Backend Verification...');
const status = vinaBackendService.getEngineStatus();
console.log('Detected Status:');
console.log(JSON.stringify(status, null, 2));

if (status.isAvailable) {
  console.log(`\nSUCCESS: Vina executable verified! Version: ${status.version}`);
  console.log(`Path: ${status.executablePath}`);
} else {
  console.error('\nFAILED to verify Vina executable');
  process.exit(1);
}
