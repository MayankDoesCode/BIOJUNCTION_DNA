/**
 * =========================================================================
 * AUTODOCK VINA LOCAL & NETLIFY BACKEND ENGINE
 * =========================================================================
 * Unified server execution engine supporting both:
 * 1. LOCAL DEVELOPMENT (Windows / macOS / Linux via VINA_EXECUTABLE)
 * 2. NETLIFY PRODUCTION (Linux serverless functions via bundled/downloaded binary)
 *
 * CRITICAL SCIENTIFIC INTEGRITY RULES:
 * 1. Executes official AutoDock Vina binary with real arguments.
 * 2. Parses authentic PDBQT output and stdout logs.
 * 3. Never invents scores or fabricates poses.
 * 4. Rigorously validates all receptor, ligand, and search space parameters.
 */

import { execFile, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { vinaResultParser, type VinaParsedResult } from '../src/services/vinaResultParser';

export interface DockingEngineStatusResponse {
  available: boolean;
  isAvailable: boolean; // Backwards compatibility
  engine: string;
  engineName: string; // Backwards compatibility
  version?: string;
  executablePath?: string;
  mode: 'CONNECTED' | 'DEMO_STANDBY';
  message?: string;
  error?: string;
  setupRequirements?: string[];
}

export interface DockingPayload {
  receptor: string;
  ligand: string;
  center_x: number;
  center_y: number;
  center_z: number;
  size_x: number;
  size_y: number;
  size_z: number;
  exhaustiveness?: number;
  num_modes?: number;
  energy_range?: number;
  cpu?: number;
  seed?: number;
}

export interface DockingSuccessResponse {
  success: true;
  jobId: string;
  engine: {
    name: string;
    version: string;
  };
  results: {
    affinity?: number;
    bestScore?: number;
    poses: VinaParsedResult['poses'];
    outputPdbqt: string;
    rawLog?: string;
  };
}

export interface DockingErrorResponse {
  success: false;
  errorCode: 'ENGINE_UNAVAILABLE' | 'INVALID_INPUT' | 'DOCKING_TIMEOUT' | 'EXECUTION_FAILED';
  message: string;
  details?: string;
}

export type DockingApiResponse = DockingSuccessResponse | DockingErrorResponse;

export const vinaBackend = {
  /**
   * Resolves the AutoDock Vina binary executable path.
   * Priority:
   * 1. Explicit VINA_EXECUTABLE or FASTAPI_VINA_EXECUTABLE environment variable
   * 2. Netlify runtime paths: /var/task/netlify/bin/vina or ./netlify/bin/vina
   * 3. Local OS workspace candidates (Windows .exe or Linux/macOS binary)
   */
  resolveExecutable(): string | null {
    const envPath = process.env.VINA_EXECUTABLE || process.env.FASTAPI_VINA_EXECUTABLE;
    if (envPath && fs.existsSync(envPath)) {
      this.ensureExecutablePermissions(envPath);
      return envPath;
    }

    const cwd = process.cwd();
    const candidatePaths: string[] = [];

    if (process.platform === 'win32') {
      candidatePaths.push(
        path.join(cwd, 'vina_1.2.7_win.exe'),
        path.join(cwd, 'vina.exe'),
        'C:\\Users\\MAYANK\\OneDrive\\Desktop\\dna\\vina_1.2.7_win.exe'
      );
    } else {
      // Linux / Netlify AWS Lambda environment
      candidatePaths.push(
        '/var/task/netlify/bin/vina',
        path.join(cwd, 'netlify', 'bin', 'vina'),
        path.join(cwd, 'bin', 'vina'),
        '/opt/bin/vina',
        '/usr/local/bin/vina',
        '/usr/bin/vina'
      );
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        this.ensureExecutablePermissions(p);
        return p;
      }
    }

    return envPath || null;
  },

  /**
   * Ensures binary has executable permissions (0755) in Unix / Netlify environments.
   */
  ensureExecutablePermissions(filePath: string): void {
    if (process.platform !== 'win32' && fs.existsSync(filePath)) {
      try {
        fs.chmodSync(filePath, 0o755);
      } catch {
        // May fail on read-only mount, ignore if already executable
      }
    }
  },

  /**
   * Tests the executable with --version.
   */
  verifyExecutable(): { verified: boolean; version?: string; path?: string; error?: string } {
    const exePath = this.resolveExecutable();

    if (!exePath) {
      return {
        verified: false,
        error: 'AutoDock Vina executable was not found on the host or in VINA_EXECUTABLE.',
      };
    }

    if (!fs.existsSync(exePath)) {
      return {
        verified: false,
        path: exePath,
        error: `AutoDock Vina path does not exist: ${exePath}`,
      };
    }

    try {
      this.ensureExecutablePermissions(exePath);
      const stdout = execFileSync(exePath, ['--version'], {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true,
      }).trim();

      const match = stdout.match(/AutoDock Vina\s+v?(\d+\.\d+\.\d+)/i);
      const version = match ? match[1] : '1.2.7';

      return {
        verified: true,
        version,
        path: exePath,
      };
    } catch (err: any) {
      return {
        verified: false,
        path: exePath,
        error: `Failed to execute "${exePath} --version": ${err.message}`,
      };
    }
  },

  /**
   * Server health / status response (/api/docking-status).
   */
  getStatus(): DockingEngineStatusResponse {
    const verification = this.verifyExecutable();

    if (verification.verified && verification.version) {
      return {
        available: true,
        isAvailable: true,
        engine: 'AutoDock Vina',
        engineName: 'AutoDock Vina',
        version: verification.version,
        executablePath: verification.path,
        mode: 'CONNECTED',
        message: `AutoDock Vina v${verification.version} Engine Available`,
        setupRequirements: [],
      };
    }

    return {
      available: false,
      isAvailable: false,
      engine: 'AutoDock Vina',
      engineName: 'AutoDock Vina',
      version: '1.2.5',
      mode: 'DEMO_STANDBY',
      error: 'ENGINE_UNAVAILABLE',
      message: 'AutoDock Vina is not available on the server.',
      setupRequirements: [
        'Set VINA_EXECUTABLE environment variable to the verified AutoDock Vina binary',
        'In production Netlify, ensure the Linux binary is placed at netlify/bin/vina',
        'Verify target receptors and ligands are in standard .PDBQT format',
      ],
    };
  },

  /**
   * Validates docking payload parameters server-side.
   */
  validatePayload(payload: any): { isValid: boolean; error?: string; validated?: DockingPayload } {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, error: 'Request body must be a valid JSON object' };
    }

    const receptor = payload.receptor ?? payload.receptorPdbqt;
    const ligand = payload.ligand ?? payload.ligandPdbqt;
    const center_x = payload.center_x ?? payload.centerX;
    const center_y = payload.center_y ?? payload.centerY;
    const center_z = payload.center_z ?? payload.centerZ;
    const size_x = payload.size_x ?? payload.sizeX;
    const size_y = payload.size_y ?? payload.sizeY;
    const size_z = payload.size_z ?? payload.sizeZ;
    const exhaustiveness = payload.exhaustiveness ?? payload.exhaustiveness ?? 8;
    const num_modes = payload.num_modes ?? payload.numModes ?? 9;
    const energy_range = payload.energy_range ?? payload.energyRange ?? 3.0;
    const cpu = payload.cpu;
    const seed = payload.seed;


    // 1. Receptor PDBQT structure validation
    if (!receptor || typeof receptor !== 'string' || receptor.trim().length < 20) {
      return { isValid: false, error: 'Receptor PDBQT structure content is required and cannot be empty' };
    }
    if (!receptor.includes('ATOM') && !receptor.includes('HETATM')) {
      return { isValid: false, error: 'Receptor does not contain valid ATOM/HETATM coordinate records' };
    }
    if (receptor.length > 20 * 1024 * 1024) {
      return { isValid: false, error: 'Receptor file exceeds maximum allowable size (20MB)' };
    }

    // 2. Ligand PDBQT structure validation
    if (!ligand || typeof ligand !== 'string' || ligand.trim().length < 20) {
      return { isValid: false, error: 'Ligand PDBQT structure content is required and cannot be empty' };
    }
    if (!ligand.includes('ATOM') && !ligand.includes('HETATM')) {
      return { isValid: false, error: 'Ligand does not contain valid ATOM/HETATM coordinate records' };
    }
    if (ligand.length > 5 * 1024 * 1024) {
      return { isValid: false, error: 'Ligand file exceeds maximum allowable size (5MB)' };
    }

    // 3. Search Box Coordinates
    const cx = Number(center_x);
    const cy = Number(center_y);
    const cz = Number(center_z);
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)) {
      return { isValid: false, error: 'Search box center coordinates (center_x, center_y, center_z) must be finite numbers' };
    }

    // 4. Search Box Dimensions
    const sx = Number(size_x);
    const sy = Number(size_y);
    const sz = Number(size_z);
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz) || sx <= 0 || sy <= 0 || sz <= 0) {
      return { isValid: false, error: 'Search box dimensions (size_x, size_y, size_z) must be positive numbers greater than 0 Å' };
    }
    if (sx > 60 || sy > 60 || sz > 60) {
      return { isValid: false, error: 'Search box dimensions must not exceed 60.0 Å limit to preserve sampling accuracy' };
    }

    // 5. Algorithm Configuration Parameters
    const exh = Number(exhaustiveness);
    if (!Number.isInteger(exh) || exh < 1 || exh > 64) {
      return { isValid: false, error: 'Exhaustiveness must be an integer between 1 and 64' };
    }

    const nModes = Number(num_modes);
    if (!Number.isInteger(nModes) || nModes < 1 || nModes > 50) {
      return { isValid: false, error: 'num_modes must be an integer between 1 and 50' };
    }

    const eRange = Number(energy_range);
    if (!Number.isFinite(eRange) || eRange <= 0.1 || eRange > 15.0) {
      return { isValid: false, error: 'energy_range must be between 0.1 and 15.0 kcal/mol' };
    }

    return {
      isValid: true,
      validated: {
        receptor,
        ligand,
        center_x: cx,
        center_y: cy,
        center_z: cz,
        size_x: sx,
        size_y: sy,
        size_z: sz,
        exhaustiveness: exh,
        num_modes: nModes,
        energy_range: eRange,
        cpu: typeof cpu === 'number' && cpu > 0 ? cpu : undefined,
        seed: typeof seed === 'number' ? seed : undefined,
      },
    };
  },

  /**
   * Executes computational docking using AutoDock Vina.
   */
  async executeDocking(payload: DockingPayload): Promise<DockingApiResponse> {
    const verification = this.verifyExecutable();
    if (!verification.verified || !verification.path) {
      return {
        success: false,
        errorCode: 'ENGINE_UNAVAILABLE',
        message: 'AutoDock Vina is not available on the server.',
        details: verification.error,
      };
    }

    const jobId = `dock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'vina-job-'));

    const receptorPath = path.join(tmpDir, 'receptor.pdbqt');
    const ligandPath = path.join(tmpDir, 'ligand.pdbqt');
    const configPath = path.join(tmpDir, 'config.txt');
    const outputPath = path.join(tmpDir, 'output.pdbqt');
    const logPath = path.join(tmpDir, 'vina.log');

    try {
      // Sanitize ligand: AutoDock Vina rejects MODEL and ENDMDL tags in input ligand files
      let cleanLigand = payload.ligand;
      if (/^MODEL\b/m.test(cleanLigand)) {
        cleanLigand = cleanLigand
          .replace(/^MODEL\s+\d+[\r\n]*/gm, '')
          .replace(/^ENDMDL[\r\n]*/gm, '')
          .replace(/^REMARK\s+VINA\s+RESULT.*[\r\n]*/gm, '')
          .trim();
      }

      // If ligand does not have ROOT / ENDROOT torsion tree definition, wrap it
      if (!/^ROOT\b/m.test(cleanLigand)) {
        cleanLigand = `ROOT\n${cleanLigand}\nENDROOT\nTORSDOF 0\n`;
      }

      await fs.promises.writeFile(receptorPath, payload.receptor, 'utf-8');
      await fs.promises.writeFile(ligandPath, cleanLigand, 'utf-8');

      const configLines = [
        `receptor = ${receptorPath}`,
        `ligand = ${ligandPath}`,
        `center_x = ${payload.center_x}`,
        `center_y = ${payload.center_y}`,
        `center_z = ${payload.center_z}`,
        `size_x = ${payload.size_x}`,
        `size_y = ${payload.size_y}`,
        `size_z = ${payload.size_z}`,
        `exhaustiveness = ${payload.exhaustiveness || 8}`,
        `num_modes = ${payload.num_modes || 9}`,
        `energy_range = ${payload.energy_range || 3.0}`,
      ];

      if (payload.cpu) configLines.push(`cpu = ${payload.cpu}`);
      if (payload.seed) configLines.push(`seed = ${payload.seed}`);

      await fs.promises.writeFile(configPath, configLines.join('\n'), 'utf-8');

      const args = [
        '--config', configPath,
        '--out', outputPath,
      ];

      // Enforce execution timeout (22 seconds) to fit within standard Netlify Function limit
      const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        execFile(
          verification.path!,
          args,
          { timeout: 22000, windowsHide: true },
          (err, stdout, stderr) => {
            if (err) {
              if (err.killed || (err as any).signal === 'SIGTERM') {
                reject(new Error('DOCKING_TIMEOUT: Docking simulation exceeded execution time limit.'));
              } else {
                reject(err);
              }
            } else {
              resolve({ stdout, stderr });
            }
          }
        );
      });

      const logText = fs.existsSync(logPath)
        ? await fs.promises.readFile(logPath, 'utf-8')
        : stdout;

      const outputPdbqt = fs.existsSync(outputPath)
        ? await fs.promises.readFile(outputPath, 'utf-8')
        : '';

      const parsed = vinaResultParser.parseVinaOutput({
        logText,
        pdbqtContent: outputPdbqt,
      });

      if (!parsed.success && parsed.poses.length === 0) {
        return {
          success: false,
          errorCode: 'EXECUTION_FAILED',
          message: parsed.error || 'Failed to parse binding modes from AutoDock Vina output',
          details: logText,
        };
      }

      return {
        success: true,
        jobId,
        engine: {
          name: 'AutoDock Vina',
          version: verification.version || '1.2.7',
        },
        results: {
          affinity: parsed.bestScore ?? parsed.dockingScore,
          bestScore: parsed.bestScore ?? parsed.dockingScore,
          poses: parsed.poses,
          outputPdbqt,
          rawLog: logText,
        },
      };
    } catch (err: any) {
      if (err.message && err.message.includes('DOCKING_TIMEOUT')) {
        return {
          success: false,
          errorCode: 'DOCKING_TIMEOUT',
          message: 'Docking simulation timed out. Reduce exhaustiveness or search box volume to complete within server limits.',
        };
      }
      return {
        success: false,
        errorCode: 'EXECUTION_FAILED',
        message: err.message || 'AutoDock Vina execution error',
      };
    } finally {
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup failure
      }
    }
  },

  /**
   * Compatibility alias for getStatus
   */
  getEngineStatus() {
    return this.getStatus();
  },

  /**
   * Compatibility alias for executeDocking
   */
  async runDocking(payload: DockingPayload) {
    const val = this.validatePayload(payload);
    if (!val.isValid || !val.validated) {
      return {
        success: false,
        errorCode: 'INVALID_INPUT' as const,
        message: val.error || 'Invalid docking parameters',
      };
    }
    return this.executeDocking(val.validated);
  },
};

export const vinaBackendService = vinaBackend;

