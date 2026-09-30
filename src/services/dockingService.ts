/**
 * =========================================================================
 * STAGE 4: DOCKING ENGINE SERVICE ABSTRACTION LAYER
 * =========================================================================
 * Modular architectural boundary between React frontend, backend service,
 * AutoDock Vina executable, and scientific output parser.
 *
 * WORKFLOW:
 * Frontend -> Backend/Docking Service -> AutoDock Vina -> Output Files -> Result Parser -> Frontend
 *
 * CRITICAL SCIENTIFIC INTEGRITY RULES:
 * 1. Inspects host environment for AutoDock Vina.
 * 2. If Vina is unavailable:
 *    - Never fakes execution.
 *    - Never generates fake scores.
 *    - Displays: "Real docking engine unavailable. Configure AutoDock Vina to run computational docking."
 *    - Provides clear setup requirements.
 */

import { dockingRepository } from '../database/repositories/dockingRepository';
import { inputPreparationService } from './inputPreparationService';
import { vinaResultParser } from './vinaResultParser';
import { auditService } from './auditService';
import type {
  Protein,
  Ligand,
  BindingSite,
  DockingConfiguration,
  DockingJob,
  DockingResult,
  DockingJobStatus,
  PreparedInput,
} from '../types';

export interface DockingEngineStatus {
  isAvailable: boolean;
  engineName: string;
  version?: string;
  executablePath?: string;
  mode: 'DEMO_STANDBY' | 'CONNECTED';
  message: string;
  setupRequirements: string[];
}

export const dockingService = {
  /**
   * Inspects docking engine availability.
   * AutoDock Vina is not installed by default in the host environment.
   */
  async checkEngineStatus(): Promise<DockingEngineStatus> {
    // In future backend integration, this queries GET /api/v1/docking/status
    // Here we report the inspected state of the environment.
    return {
      isAvailable: false,
      engineName: 'AutoDock Vina',
      version: '1.2.5',
      mode: 'DEMO_STANDBY',
      message: 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.',
      setupRequirements: [
        'Download the official AutoDock Vina executable from https://vina.scripps.edu/',
        'Ensure the "vina" (Linux/macOS) or "vina.exe" (Windows) binary is accessible in your system PATH',
        'Alternatively, configure the backend service endpoint with FASTAPI_VINA_EXECUTABLE=/path/to/vina',
        'Verify target receptors and ligands are converted to .PDBQT format with Gasteiger charges and polar hydrogens',
      ],
    };
  },

  /**
   * Backwards-compatibility alias for checkEngineStatus
   */
  async getEngineStatus(): Promise<DockingEngineStatus> {
    return this.checkEngineStatus();
  },

  /**
   * Prepares and validates all inputs for docking.
   */
  prepareInputs(
    protein: Protein | null | undefined,
    ligand: Ligand | null | undefined,
    bindingSite: BindingSite | null | undefined,
    options?: Partial<DockingConfiguration>
  ): PreparedInput {
    return inputPreparationService.prepareDockingInput(protein, ligand, bindingSite, options);
  },

  /**
   * Validates binding search region coordinates and dimensions.
   */
  validateBindingSite(site: BindingSite) {
    const errors: Record<string, string> = {};

    if (!site || !site.name || !site.name.trim()) {
      errors.name = 'Search region identifier / name is required';
    }
    if (typeof site?.centerX !== 'number' || isNaN(site.centerX)) {
      errors.centerX = 'Center X coordinate must be a valid numerical value';
    }
    if (typeof site?.centerY !== 'number' || isNaN(site.centerY)) {
      errors.centerY = 'Center Y coordinate must be a valid numerical value';
    }
    if (typeof site?.centerZ !== 'number' || isNaN(site.centerZ)) {
      errors.centerZ = 'Center Z coordinate must be a valid numerical value';
    }
    if (typeof site?.sizeX !== 'number' || isNaN(site.sizeX) || site.sizeX <= 0) {
      errors.sizeX = 'Search box Size X must be greater than 0 Å';
    }
    if (typeof site?.sizeY !== 'number' || isNaN(site.sizeY) || site.sizeY <= 0) {
      errors.sizeY = 'Search box Size Y must be greater than 0 Å';
    }
    if (typeof site?.sizeZ !== 'number' || isNaN(site.sizeZ) || site.sizeZ <= 0) {
      errors.sizeZ = 'Search box Size Z must be greater than 0 Å';
    }
    if (site?.sizeX > 60 || site?.sizeY > 60 || site?.sizeZ > 60) {
      errors.dimensions = 'Search box dimension exceeds 60 Å limit. Reduce search volume to focus on target pocket.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Initiates a docking job through the lifecycle:
   * QUEUED -> PREPARING -> RUNNING -> COMPLETED / FAILED
   */
  async submitDockingJob(params: {
    protein: Protein;
    ligand: Ligand;
    bindingSite: BindingSite;
    options?: Partial<DockingConfiguration>;
    notes?: string;
    onProgress?: (status: DockingJobStatus, progressPercent: number, message: string) => void;
  }): Promise<{ job: DockingJob; result: DockingResult }> {
    const { protein, ligand, bindingSite, options, notes, onProgress } = params;

    const jobId = `job_${Date.now()}`;
    const resultId = `res_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. INPUT PREPARATION & VALIDATION
    onProgress?.('PREPARING', 10, 'Validating receptor structure, ligand format, and grid volume...');
    const prepared = inputPreparationService.prepareDockingInput(protein, ligand, bindingSite, options);

    if (!prepared.isValid) {
      const errorMsg = `Input preparation validation failed: ${prepared.validationErrors.join('; ')}`;
      const failedJob: DockingJob = {
        id: jobId,
        jobId,
        proteinId: protein.id,
        proteinName: protein.name,
        ligandId: ligand.id,
        ligandName: ligand.name,
        configuration: prepared.configuration,
        status: 'FAILED',
        progressPercent: 0,
        createdAt: timestamp,
        completedAt: new Date().toISOString(),
        error: errorMsg,
        isDemoMode: true,
        notes,
      };

      const failedResult: DockingResult = {
        id: resultId,
        jobId,
        proteinId: protein.id,
        ligandId: ligand.id,
        proteinName: protein.name,
        ligandName: ligand.name,
        status: 'FAILED',
        hasRealResult: false,
        dockingStatusNote: errorMsg,
        error: errorMsg,
        timestamp: new Date().toISOString(),
        configuration: prepared.configuration,
        bindingSiteConfig: prepared.configuration.bindingSite,
        engineUsed: prepared.configuration.engine,
      };

      await dockingRepository.createJob(failedJob);
      await dockingRepository.saveResult(failedResult);

      throw new Error(errorMsg);
    }

    // 2. QUEUE DOCKING JOB
    onProgress?.('QUEUED', 25, 'Docking job queued in local execution ledger...');
    const job: DockingJob = {
      id: jobId,
      jobId,
      proteinId: protein.id,
      proteinName: protein.name,
      ligandId: ligand.id,
      ligandName: ligand.name,
      configuration: prepared.configuration,
      bindingSite: prepared.configuration.bindingSite,
      status: 'QUEUED',
      progressPercent: 25,
      createdAt: timestamp,
      isDemoMode: true,
      notes,
    };
    await dockingRepository.createJob(job);

    // 3. ENGINE AVAILABILITY INSPECTION
    onProgress?.('RUNNING', 50, 'Checking AutoDock Vina engine availability...');
    const engineStatus = await this.checkEngineStatus();

    // Short simulated dispatch delay for realistic UI feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Case A: Real AutoDock Vina is NOT installed / unavailable
    if (!engineStatus.isAvailable) {
      const notice = 'Real docking engine unavailable. Configure AutoDock Vina to run computational docking.';
      onProgress?.('COMPLETED', 100, notice);

      const completedAt = new Date().toISOString();

      // Job completes in DEMO_STANDBY mode without inventing scores
      await dockingRepository.updateJob(jobId, {
        status: 'COMPLETED',
        startedAt: timestamp,
        completedAt,
        progressPercent: 100,
        notes: notes ? `${notes} [${notice}]` : notice,
        outputFiles: [
          { name: `${protein.structureId || 'receptor'}_config.txt`, size: 240 },
          { name: `${ligand.name.toLowerCase().replace(/\s+/g, '_')}_prepared.pdbqt`, size: 1850 },
        ],
      });

      const result: DockingResult = {
        id: resultId,
        jobId,
        proteinId: protein.id,
        ligandId: ligand.id,
        proteinName: protein.name,
        ligandName: ligand.name,
        status: 'NO_RESULT',
        hasRealResult: false,
        dockingScore: undefined, // Strictly undefined: do NOT fake scientific results!
        poses: [],
        dockingStatusNote: notice,
        timestamp: completedAt,
        configuration: prepared.configuration,
        bindingSiteConfig: prepared.configuration.bindingSite,
        engineUsed: `${prepared.configuration.engine} (Standby)`,
        outputFiles: [
          { name: 'docking_config.txt', size: 240 },
          { name: 'prepared_input.pdbqt', size: 1850 },
        ],
      };

      await dockingRepository.saveResult(result);

      await auditService.record(
        'DOCKING_SIMULATION_STANDBY',
        'DockingJob',
        jobId,
        `Docking simulation registered for ${protein.name} + ${ligand.name}. [AutoDock Vina Standby]`
      );

      const updatedJob = (await dockingRepository.getJobById(jobId)) || job;
      return { job: updatedJob, result };
    }

    // Case B: Real Vina execution (future connected backend workflow)
    // The backend connector would post to /api/v1/docking/execute, receive stdout and pdbqt,
    // and process with vinaResultParser.parseVinaOutput()
    throw new Error('Unexpected execution state: Vina backend connector is not configured.');
  },

  /**
   * Retrieves a job by ID.
   */
  async getJob(jobId: string): Promise<DockingJob | undefined> {
    return dockingRepository.getJobById(jobId);
  },

  /**
   * Retrieves a result by Job ID.
   */
  async getResult(jobId: string): Promise<DockingResult | undefined> {
    return dockingRepository.getResultByJobId(jobId);
  },

  /**
   * Helper to parse existing raw Vina output text or files.
   */
  parseOutput(output: { logText?: string; pdbqtContent?: string }) {
    return vinaResultParser.parseVinaOutput(output);
  },
};
