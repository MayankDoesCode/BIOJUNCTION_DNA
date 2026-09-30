/**
 * =========================================================================
 * MULTI-CANDIDATE DOCKING COMPARISON SERVICE
 * =========================================================================
 * Evaluates and compares multiple candidate molecules against the SAME
 * target receptor under controlled experimental docking configurations.
 *
 * CRITICAL SCIENTIFIC INTEGRITY RULES:
 * 1. Requires at least two candidates for comparison.
 * 2. Enforces same-protein evaluation constraint.
 * 3. Detects and warns about configuration mismatches (different search regions or exhaustiveness).
 * 4. Never auto-ranks or claims a docking score proves clinical efficacy.
 * 5. Uses "Not available" for uncomputed metrics; never fabricates values.
 */

import type {
  Protein,
  Ligand,
  DockingJob,
  DockingResult,
  DockingConfiguration,
  DockingComparisonRow,
  ComparisonSummary,
} from '../types';

export interface ComparisonValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConfigurationCompatibilityResult {
  isCompatible: boolean;
  warnings: string[];
}

export const comparisonService = {
  /**
   * Validates prerequisites for comparing candidate molecules.
   */
  validateComparison(params: {
    targetProtein: Protein | null | undefined;
    selectedCandidateIds: string[];
  }): ComparisonValidationResult {
    const { targetProtein, selectedCandidateIds } = params;
    const errors: string[] = [];

    if (!targetProtein || !targetProtein.id) {
      errors.push('Target protein receptor is required for multi-candidate comparison.');
    }

    if (!selectedCandidateIds || selectedCandidateIds.length < 2) {
      errors.push('At least two candidates are required for comparison.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Checks whether multiple docking configurations share consistent parameters.
   */
  evaluateConfigurationCompatibility(
    configurations: Array<DockingConfiguration | undefined>
  ): ConfigurationCompatibilityResult {
    const validConfigs = configurations.filter((c): c is DockingConfiguration => !!c);
    const warnings: string[] = [];

    if (validConfigs.length <= 1) {
      return { isCompatible: true, warnings: [] };
    }

    const baseline = validConfigs[0];
    const bSite = baseline.bindingSite;

    for (let i = 1; i < validConfigs.length; i++) {
      const current = validConfigs[i];
      const cSite = current.bindingSite;

      // 1. Check Binding Site Center (tolerance: 0.5 Å)
      if (
        bSite &&
        cSite &&
        (Math.abs(bSite.centerX - cSite.centerX) > 0.5 ||
          Math.abs(bSite.centerY - cSite.centerY) > 0.5 ||
          Math.abs(bSite.centerZ - cSite.centerZ) > 0.5)
      ) {
        warnings.push(
          `Search region center coordinates differ between runs (${bSite.name} vs ${cSite.name}). Comparisons may not reflect identical binding pockets.`
        );
      }

      // 2. Check Dimensions (tolerance: 1.0 Å)
      if (
        bSite &&
        cSite &&
        (Math.abs(bSite.sizeX - cSite.sizeX) > 1.0 ||
          Math.abs(bSite.sizeY - cSite.sizeY) > 1.0 ||
          Math.abs(bSite.sizeZ - cSite.sizeZ) > 1.0)
      ) {
        warnings.push(
          `Search box dimensions differ between runs (${bSite.sizeX}×${bSite.sizeY}×${bSite.sizeZ} Å vs ${cSite.sizeX}×${cSite.sizeY}×${cSite.sizeZ} Å).`
        );
      }

      // 3. Check Docking Engine
      if (baseline.engine !== current.engine) {
        warnings.push(
          `Different docking engines were used (${baseline.engine} vs ${current.engine}). Direct scoring comparison is not scientifically calibrated.`
        );
      }

      // 4. Check Exhaustiveness
      if (baseline.exhaustiveness !== current.exhaustiveness) {
        warnings.push(
          `Search exhaustiveness differs (${baseline.exhaustiveness} vs ${current.exhaustiveness}). Convergence accuracy varies.`
        );
      }
    }

    const uniqueWarnings = Array.from(new Set(warnings));

    return {
      isCompatible: uniqueWarnings.length === 0,
      warnings: uniqueWarnings,
    };
  },

  /**
   * Compiles comparison table rows for selected candidates evaluated against the target protein.
   */
  buildComparisonRows(params: {
    targetProtein: Protein;
    selectedCandidates: Ligand[];
    jobs: DockingJob[];
    results: DockingResult[];
  }): DockingComparisonRow[] {
    const { targetProtein, selectedCandidates, jobs, results } = params;

    // Collect configurations for compatibility check
    const candidateConfigs: Array<DockingConfiguration | undefined> = [];

    const rows: DockingComparisonRow[] = selectedCandidates.map((candidate) => {
      // Find latest job for this protein & ligand
      const matchingJob = jobs.find(
        (j) =>
          (j.proteinId === targetProtein.id || j.proteinName === targetProtein.name) &&
          (j.ligandId === candidate.id || j.ligandName === candidate.name)
      );

      // Find matching result if job exists
      const matchingResult = matchingJob
        ? results.find((r) => r.jobId === matchingJob.jobId)
        : results.find(
            (r) =>
              (r.proteinId === targetProtein.id || r.proteinName === targetProtein.name) &&
              (r.ligandId === candidate.id || r.ligandName === candidate.name)
          );

      const config = matchingResult?.configuration || matchingJob?.configuration;
      candidateConfigs.push(config);

      // Determine docking status
      let dockingStatus: DockingComparisonRow['dockingStatus'] = 'AWAITING_DOCKING';
      if (matchingJob) {
        if (matchingJob.status === 'COMPLETED') {
          dockingStatus = matchingResult?.hasRealResult ? 'COMPLETED' : 'STANDBY';
        } else if (matchingJob.status === 'FAILED') {
          dockingStatus = 'FAILED';
        } else if (matchingJob.status === 'RUNNING') {
          dockingStatus = 'RUNNING';
        } else if (matchingJob.status === 'PREPARING' || matchingJob.status === 'QUEUED') {
          dockingStatus = 'PENDING';
        }
      } else if (matchingResult) {
        dockingStatus = matchingResult.hasRealResult ? 'COMPLETED' : 'STANDBY';
      }

      // Best pose label
      const bestPose =
        matchingResult?.poses && matchingResult.poses.length > 0
          ? `Pose #${matchingResult.poses[0].mode}`
          : undefined;

      // Extract interaction metrics if computed
      const interactions = matchingResult?.interactionAnalysis;
      const hBondsCount = interactions?.hasAnalysis ? interactions.hydrogenBondsCount : undefined;
      const hydrophobicCount = interactions?.hasAnalysis
        ? interactions.hydrophobicContactsCount
        : undefined;
      const interactingResiduesCount = interactions?.hasAnalysis
        ? interactions.interactingResiduesCount
        : undefined;

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        chemicalName: candidate.chemicalName,
        formula: candidate.formula,
        isDemo: candidate.isDemo,
        jobId: matchingJob?.jobId || matchingResult?.jobId,
        dockingStatus,
        dockingScore: matchingResult?.hasRealResult ? matchingResult.dockingScore : undefined,
        bestPose,
        hydrogenBondsCount: hBondsCount,
        hydrophobicContactsCount: hydrophobicCount,
        interactingResiduesCount: interactingResiduesCount,
        configuration: config,
        isCompatible: true,
        hasResult: !!matchingResult || !!matchingJob,
      };
    });

    // Check configuration compatibility across rows
    const compatibility = this.evaluateConfigurationCompatibility(candidateConfigs);

    return rows.map((r) => ({
      ...r,
      isCompatible: compatibility.isCompatible,
      compatibilityNote: compatibility.warnings.length > 0 ? compatibility.warnings[0] : undefined,
    }));
  },

  /**
   * Builds the compact summary for the comparison page.
   */
  buildComparisonSummary(params: {
    targetProtein: Protein;
    rows: DockingComparisonRow[];
  }): ComparisonSummary {
    const { targetProtein, rows } = params;

    const completed = rows.filter((r) => r.dockingStatus === 'COMPLETED').length;
    const pending = rows.filter(
      (r) =>
        r.dockingStatus === 'PENDING' ||
        r.dockingStatus === 'STANDBY' ||
        r.dockingStatus === 'QUEUED' ||
        r.dockingStatus === 'RUNNING' ||
        r.dockingStatus === 'AWAITING_DOCKING'
    ).length;
    const failed = rows.filter((r) => r.dockingStatus === 'FAILED').length;

    const configs = rows.map((r) => r.configuration);
    const compatibility = this.evaluateConfigurationCompatibility(configs);

    return {
      targetProteinName: targetProtein.name,
      targetProteinId: targetProtein.id,
      totalCandidates: rows.length,
      completedDockings: completed,
      pendingDockings: pending,
      failedDockings: failed,
      hasConfigurationMismatch: !compatibility.isCompatible,
      configurationWarnings: compatibility.warnings,
    };
  },
};
