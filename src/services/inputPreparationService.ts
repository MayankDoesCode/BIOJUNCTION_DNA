/**
 * =========================================================================
 * INPUT PREPARATION PIPELINE ABSTRACTION
 * =========================================================================
 * Rigorously validates macromolecular receptors, candidate ligands,
 * and search region parameters before computational docking.
 *
 * CRITICAL RULE:
 * Does NOT silently modify scientific parameters entered by the user.
 */

import type { Protein, Ligand, BindingSite, DockingConfiguration, PreparedInput } from '../types';

export interface PreparedProteinResult {
  isValid: boolean;
  format: string;
  pdbqtContent?: string;
  atomCountEstimate?: number;
  errors: string[];
  warnings: string[];
}

export interface PreparedLigandResult {
  isValid: boolean;
  format: string;
  pdbqtContent?: string;
  rotatableBondsEstimate?: number;
  errors: string[];
  warnings: string[];
}

export interface PreparedConfigResult {
  isValid: boolean;
  configuration: DockingConfiguration;
  errors: string[];
  warnings: string[];
}

export const inputPreparationService = {
  /**
   * Prepares and validates receptor target protein structure.
   */
  prepareProtein(protein: Protein | null | undefined): PreparedProteinResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!protein) {
      return {
        isValid: false,
        format: 'UNKNOWN',
        errors: ['Target protein receptor is required / missing or undefined'],
        warnings: [],
      };
    }

    if (!protein.name || !protein.name.trim()) {
      errors.push('Protein target identifier / name is missing');
    }

    const format = (protein.fileFormat || protein.fileName?.split('.').pop() || 'PDBQT').toUpperCase();

    if (!['PDBQT', 'PDB', 'CIF'].includes(format)) {
      errors.push(`Unsupported receptor structure format: .${format}. AutoDock Vina requires .PDBQT format.`);
    }

    if (format === 'PDB') {
      warnings.push(
        'Receptor is in .PDB format. Conversion to .PDBQT (adding polar hydrogens and Gasteiger partial charges) will be required prior to Vina execution.'
      );
    }

    // Check file content or size
    if (protein.fileSize && protein.fileSize <= 0) {
      errors.push('Receptor structure file appears empty (0 bytes).');
    }

    return {
      isValid: errors.length === 0,
      format,
      pdbqtContent: protein.fileData,
      errors,
      warnings,
    };
  },

  /**
   * Prepares and validates candidate small-molecule ligand.
   */
  prepareLigand(ligand: Ligand | null | undefined): PreparedLigandResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ligand) {
      return {
        isValid: false,
        format: 'UNKNOWN',
        errors: ['Candidate molecule ligand is required / missing or undefined'],
        warnings: [],
      };
    }

    if (!ligand.name || !ligand.name.trim()) {
      errors.push('Candidate molecule identifier / name is missing');
    }

    const format = (ligand.fileFormat || ligand.fileName?.split('.').pop() || 'PDBQT').toUpperCase();

    if (!['PDBQT', 'SDF', 'MOL2', 'PDB'].includes(format)) {
      errors.push(`Unsupported ligand format: .${format}. AutoDock Vina requires .PDBQT format with torsion tree.`);
    }

    if (format !== 'PDBQT') {
      warnings.push(
        `Ligand is in .${format} format. Parameterization and torsion definition (ROOT/BRANCH/ENDBRANCH) via Meeko/AutoDockTools required before docking.`
      );
    }

    return {
      isValid: errors.length === 0,
      format,
      pdbqtContent: ligand.fileData,
      errors,
      warnings,
    };
  },

  /**
   * Prepares and validates 3D grid search box and algorithm configuration.
   * STRICT: Does not silently modify coordinates or dimensional bounds!
   */
  prepareDockingConfiguration(
    bindingSite: BindingSite | null | undefined,
    options?: Partial<DockingConfiguration>
  ): PreparedConfigResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bindingSite) {
      return {
        isValid: false,
        configuration: {
          engine: 'AutoDock Vina',
          bindingSite: {
            name: 'Unspecified',
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            sizeX: 20,
            sizeY: 20,
            sizeZ: 20,
          },
          exhaustiveness: 8,
          numModes: 9,
          energyRange: 3.0,
        },
        errors: ['Binding site / search region is missing'],
        warnings: [],
      };
    }

    if (!bindingSite.name || !bindingSite.name.trim()) {
      errors.push('Search region identifier / name is required');
    }

    // Validate center coordinates
    if (typeof bindingSite.centerX !== 'number' || isNaN(bindingSite.centerX)) {
      errors.push('Center X coordinate must be a valid numerical value');
    }
    if (typeof bindingSite.centerY !== 'number' || isNaN(bindingSite.centerY)) {
      errors.push('Center Y coordinate must be a valid numerical value');
    }
    if (typeof bindingSite.centerZ !== 'number' || isNaN(bindingSite.centerZ)) {
      errors.push('Center Z coordinate must be a valid numerical value');
    }

    // Validate size dimensions
    if (typeof bindingSite.sizeX !== 'number' || isNaN(bindingSite.sizeX) || bindingSite.sizeX <= 0) {
      errors.push('Search box Size X must be greater than 0 Å');
    }
    if (typeof bindingSite.sizeY !== 'number' || isNaN(bindingSite.sizeY) || bindingSite.sizeY <= 0) {
      errors.push('Search box Size Y must be greater than 0 Å');
    }
    if (typeof bindingSite.sizeZ !== 'number' || isNaN(bindingSite.sizeZ) || bindingSite.sizeZ <= 0) {
      errors.push('Search box Size Z must be greater than 0 Å');
    }

    // Bound check (excessive volumes severely degrade Vina sampling precision)
    if (bindingSite.sizeX > 60 || bindingSite.sizeY > 60 || bindingSite.sizeZ > 60) {
      errors.push('Search box dimension exceeds 60.0 Å limit. Reduce search volume to focus on target pocket.');
    }

    if (bindingSite.sizeX < 10 || bindingSite.sizeY < 10 || bindingSite.sizeZ < 10) {
      warnings.push(
        'Search box volume is smaller than 10 Å in one or more dimensions; may truncate flexible ligand conformations.'
      );
    }

    const exhaustiveness = options?.exhaustiveness ?? 8;
    if (exhaustiveness < 1 || exhaustiveness > 64) {
      errors.push('Exhaustiveness must be an integer between 1 and 64');
    }

    const numModes = options?.numModes ?? 9;
    if (numModes < 1 || numModes > 50) {
      errors.push('Number of binding modes must be between 1 and 50');
    }

    const energyRange = options?.energyRange ?? 3.0;
    if (energyRange <= 0 || energyRange > 15) {
      errors.push('Energy range must be between 0.1 and 15.0 kcal/mol');
    }

    const configuration: DockingConfiguration = {
      engine: options?.engine || 'AutoDock Vina',
      bindingSite: { ...bindingSite },
      exhaustiveness,
      numModes,
      energyRange,
      cpu: options?.cpu,
      seed: options?.seed,
    };

    return {
      isValid: errors.length === 0,
      configuration,
      errors,
      warnings,
    };
  },

  /**
   * Complete end-to-end input preparation pipeline.
   */
  prepareDockingInput(
    protein: Protein | null | undefined,
    ligand: Ligand | null | undefined,
    bindingSite: BindingSite | null | undefined,
    options?: Partial<DockingConfiguration>
  ): PreparedInput {
    const proteinPrep = this.prepareProtein(protein);
    const ligandPrep = this.prepareLigand(ligand);
    const configPrep = this.prepareDockingConfiguration(bindingSite, options);

    const validationErrors = [
      ...proteinPrep.errors,
      ...ligandPrep.errors,
      ...configPrep.errors,
    ];

    const warnings = [
      ...proteinPrep.warnings,
      ...ligandPrep.warnings,
      ...configPrep.warnings,
    ];

    return {
      proteinId: protein?.id || 'unknown',
      proteinName: protein?.name || 'Unknown Receptor',
      proteinFormat: proteinPrep.format,
      proteinPdbqtContent: proteinPrep.pdbqtContent,
      ligandId: ligand?.id || 'unknown',
      ligandName: ligand?.name || 'Unknown Ligand',
      ligandFormat: ligandPrep.format,
      ligandPdbqtContent: ligandPrep.pdbqtContent,
      configuration: configPrep.configuration,
      isValid: validationErrors.length === 0,
      validationErrors,
      warnings,
    };
  },
};
