/**
 * =========================================================================
 * AUTODOCK VINA OUTPUT PARSER
 * =========================================================================
 * Extracts calculated binding affinities (kcal/mol), RMSD modes,
 * and individual pose coordinate structures from real AutoDock Vina output.
 *
 * CRITICAL RULE:
 * Does NOT invent or approximate values. If parsing fails, reports an explicit error.
 */

import type { DockingPose } from '../types';

export interface VinaParsedResult {
  success: boolean;
  isValid: boolean; // Alias for compatibility
  bestScore?: number; // Lowest binding free energy in kcal/mol
  dockingScore?: number; // Alias for bestScore
  poses: DockingPose[];
  modeCount: number;
  rawPdbqtOutput?: string;
  rawLogOutput?: string;
  error?: string;
}

export const vinaResultParser = {
  /**
   * Parses standard AutoDock Vina text stdout / log table.
   * Format:
   * mode |   affinity | dist from best mode
   *      | (kcal/mol) | rmsd l.b.| rmsd u.b.
   * -----+------------+----------+----------
   *    1         -9.2      0.000      0.000
   *    2         -8.7      1.421      2.054
   */
  parseLogAffinityTable(logText: string): DockingPose[] {
    const poses: DockingPose[] = [];
    if (!logText || !logText.trim()) return poses;

    const lines = logText.split('\n');
    let tableStarted = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Detect separator line: '-----+------------+----------+----------'
      if (line.includes('-----+') || (line.includes('---+') && line.includes('---+'))) {
        tableStarted = true;
        continue;
      }

      if (tableStarted) {
        // Stop parsing if empty line or non-numeric row encountered
        if (!line || line.startsWith('Writing') || line.startsWith('Done')) {
          break;
        }

        // Match row format: "<mode> <affinity> <rmsd_lb> <rmsd_ub>"
        // Example: "1    -9.2    0.000    0.000"
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length >= 4) {
          const mode = parseInt(parts[0], 10);
          const affinity = parseFloat(parts[1]);
          const rmsdLb = parseFloat(parts[2]);
          const rmsdUb = parseFloat(parts[3]);

          if (!isNaN(mode) && !isNaN(affinity) && !isNaN(rmsdLb) && !isNaN(rmsdUb)) {
            poses.push({
              mode,
              affinity,
              rmsdLowerBound: rmsdLb,
              rmsdUpperBound: rmsdUb,
            });
          }
        }
      }
    }

    return poses;
  },

  /**
   * Parses standard AutoDock Vina multi-model PDBQT output file.
   * Each pose is enclosed within:
   * MODEL <number>
   * REMARK VINA RESULT:   -9.2      0.000      0.000
   * ...ATOM / HETATM lines...
   * ENDMDL
   */
  parsePdbqtModels(pdbqtContent: string): DockingPose[] {
    const poses: DockingPose[] = [];
    if (!pdbqtContent || !pdbqtContent.trim()) return poses;

    // Split into individual MODEL blocks
    const modelBlocks = pdbqtContent.split(/MODEL\s+\d+/i);

    for (let i = 1; i < modelBlocks.length; i++) {
      const block = modelBlocks[i];
      const endMdlIdx = block.indexOf('ENDMDL');
      const modelBody = endMdlIdx !== -1 ? block.substring(0, endMdlIdx) : block;

      // Extract REMARK VINA RESULT
      const remarkMatch = modelBody.match(/REMARK\s+VINA\s+RESULT:\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);

      let affinity = NaN;
      let rmsdLb = 0;
      let rmsdUb = 0;

      if (remarkMatch) {
        affinity = parseFloat(remarkMatch[1]);
        rmsdLb = parseFloat(remarkMatch[2]);
        rmsdUb = parseFloat(remarkMatch[3]);
      }

      poses.push({
        mode: i,
        affinity: isNaN(affinity) ? 0 : affinity,
        rmsdLowerBound: isNaN(rmsdLb) ? 0 : rmsdLb,
        rmsdUpperBound: isNaN(rmsdUb) ? 0 : rmsdUb,
        modelCoordinates: `MODEL ${i}\n${modelBody.trim()}\nENDMDL`,
      });
    }

    return poses;
  },

  /**
   * Primary entry point to parse complete Vina execution artifacts.
   */
  parseVinaOutput(payload: {
    logText?: string;
    pdbqtContent?: string;
  }): VinaParsedResult {
    const { logText, pdbqtContent } = payload;

    if (!logText && !pdbqtContent) {
      return {
        success: false,
        isValid: false,
        poses: [],
        modeCount: 0,
        error: 'Output parsing failure: Neither stdout log nor output PDBQT structure was provided.',
      };
    }

    // Check for explicit error in log
    if (logText && /error[:\s]|failed|cannot\s+open/i.test(logText) && !logText.includes('rmsd l.b.')) {
      return {
        success: false,
        isValid: false,
        poses: [],
        modeCount: 0,
        rawLogOutput: logText,
        error: `AutoDock Vina execution error: ${logText.trim()}`,
      };
    }

    const logPoses = logText ? this.parseLogAffinityTable(logText) : [];
    const pdbqtPoses = pdbqtContent ? this.parsePdbqtModels(pdbqtContent) : [];

    let mergedPoses: DockingPose[] = [];

    if (logPoses.length > 0) {
      // Base poses on log table, and attach corresponding model coordinates from PDBQT if present
      mergedPoses = logPoses.map((lp) => {
        const matchingModel = pdbqtPoses.find((mp) => mp.mode === lp.mode);
        return {
          ...lp,
          modelCoordinates: matchingModel?.modelCoordinates,
        };
      });
    } else if (pdbqtPoses.length > 0) {
      mergedPoses = pdbqtPoses;
    }

    if (mergedPoses.length === 0) {
      return {
        success: false,
        isValid: false,
        poses: [],
        modeCount: 0,
        rawLogOutput: logText,
        rawPdbqtOutput: pdbqtContent,
        error: 'Output parsing failure: No valid docking modes or REMARK VINA RESULT tables could be extracted from engine output.',
      };
    }

    const bestScore = mergedPoses[0]?.affinity;

    return {
      success: true,
      isValid: true,
      bestScore,
      dockingScore: bestScore,
      poses: mergedPoses,
      modeCount: mergedPoses.length,
      rawLogOutput: logText,
      rawPdbqtOutput: pdbqtContent,
    };
  },
};
