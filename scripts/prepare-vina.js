/**
 * Build-time AutoDock Vina Binary Verification & Acquisition Hook
 * Pinned Version: AutoDock Vina v1.2.7 (Official CCSB Scripps release)
 * URL: https://github.com/ccsb-scripps/AutoDock-Vina/releases/download/v1.2.7/vina_1.2.7_linux_x86_64
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const VINA_VERSION = '1.2.7';
const LINUX_BINARY_URL = `https://github.com/ccsb-scripps/AutoDock-Vina/releases/download/v${VINA_VERSION}/vina_${VINA_VERSION}_linux_x86_64`;
const TARGET_DIR = path.resolve(process.cwd(), 'netlify/bin');
const TARGET_FILE = path.join(TARGET_DIR, 'vina');

async function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download binary: HTTP status ${res.statusCode}`));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          if (process.platform !== 'win32') {
            try {
              fs.chmodSync(dest, 0o755);
            } catch (e) {
              console.warn('[Vina Prepare] Warning setting chmod:', e.message);
            }
          }
          resolve();
        });
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  if (fs.existsSync(TARGET_FILE)) {
    const stats = fs.statSync(TARGET_FILE);
    if (stats.size > 1000000) {
      console.log(`[Vina Prepare] Official Linux binary found at ${TARGET_FILE} (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(TARGET_FILE, 0o755);
        } catch {
          // ignore
        }
      }
      return;
    }
  }

  console.log(`[Vina Prepare] Acquiring official AutoDock Vina v${VINA_VERSION} Linux binary from GitHub releases...`);
  try {
    await downloadBinary(LINUX_BINARY_URL, TARGET_FILE);
    console.log(`[Vina Prepare] Successfully acquired AutoDock Vina v${VINA_VERSION} binary.`);
  } catch (err) {
    console.error(`[Vina Prepare] Failed to download binary: ${err.message}`);
    // Do not fail hard during local Windows build if Windows binary is present
    if (process.platform === 'win32') {
      console.log('[Vina Prepare] Local Windows environment detected; proceeding with local Windows Vina configuration.');
    } else {
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[Vina Prepare] Unexpected error:', err);
  if (process.platform !== 'win32') process.exit(1);
});
