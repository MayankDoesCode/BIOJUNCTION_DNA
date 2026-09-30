import { db } from '../db';
import type { DockingJob, DockingResult } from '../../types';

export const dockingRepository = {
  /**
   * Retrieves all docking simulation jobs.
   */
  async getJobs(): Promise<DockingJob[]> {
    return db.dockingJobs.orderBy('createdAt').reverse().toArray();
  },

  /**
   * Retrieves a docking job by ID or jobId.
   */
  async getJobById(id: string): Promise<DockingJob | undefined> {
    const direct = await db.dockingJobs.get(id);
    if (direct) return direct;
    return db.dockingJobs.where('jobId').equals(id).first();
  },

  /**
   * Saves a new docking simulation job.
   */
  async createJob(job: DockingJob): Promise<string> {
    const toSave: DockingJob = {
      ...job,
      id: job.id || job.jobId,
      jobId: job.jobId || job.id,
      createdAt: job.createdAt || new Date().toISOString(),
    };
    return db.dockingJobs.add(toSave);
  },

  /**
   * Updates an existing job record.
   */
  async updateJob(id: string, updates: Partial<DockingJob>): Promise<number> {
    return db.dockingJobs.update(id, updates);
  },

  /**
   * Updates an existing job status.
   */
  async updateJobStatus(
    id: string,
    status: DockingJob['status'],
    error?: string,
    completedAt?: string
  ): Promise<number> {
    return db.dockingJobs.update(id, {
      status,
      error,
      completedAt: completedAt || (status === 'COMPLETED' || status === 'FAILED' ? new Date().toISOString() : undefined),
    });
  },

  /**
   * Retrieves all docking results.
   */
  async getResults(): Promise<DockingResult[]> {
    return db.dockingResults.orderBy('timestamp').reverse().toArray();
  },

  /**
   * Retrieves result associated with a specific job.
   */
  async getResultByJobId(jobId: string): Promise<DockingResult | undefined> {
    return db.dockingResults.where('jobId').equals(jobId).first();
  },

  /**
   * Saves a docking result record.
   */
  async saveResult(result: DockingResult): Promise<string> {
    return db.dockingResults.add(result);
  },
};
