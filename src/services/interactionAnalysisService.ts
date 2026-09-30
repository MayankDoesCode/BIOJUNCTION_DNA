/**
 * =========================================================================
 * INTERACTION ANALYSIS SERVICE
 * =========================================================================
 * Rigorous geometric analysis of protein-ligand complexes.
 * Identifies hydrogen bonds, hydrophobic contacts, and interacting pocket residues
 * strictly from 3D atomic coordinates.
 *
 * CRITICAL SCIENTIFIC INTEGRITY RULES:
 * 1. Never infer interactions simply from docking scores.
 * 2. Never fabricate residues, bonds, distances, or contact types.
 * 3. If atomic coordinates are missing or analysis is not yet performed,
 *    returns hasAnalysis: false with:
 *    "Interaction analysis is not available for this docking result."
 */

import type { MolecularInteraction, InteractionAnalysisResult } from '../types';

interface AtomRecord {
  recordType: 'ATOM' | 'HETATM';
  serial: number;
  name: string;
  resName: string;
  chain: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  element: string;
}

export const interactionAnalysisService = {
  /**
   * Parses standard PDB or PDBQT atom lines.
   */
  parseAtoms(content?: string): AtomRecord[] {
    if (!content || !content.trim()) return [];

    const atoms: AtomRecord[] = [];
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.startsWith('ATOM') && !line.startsWith('HETATM')) continue;

      try {
        const recordType = line.substring(0, 6).trim() as 'ATOM' | 'HETATM';
        const serial = parseInt(line.substring(6, 11).trim(), 10);
        const name = line.substring(12, 16).trim();
        const resName = line.substring(17, 20).trim();
        const chain = line.substring(21, 22).trim() || 'A';
        const resSeq = parseInt(line.substring(22, 26).trim(), 10);
        const x = parseFloat(line.substring(30, 38).trim());
        const y = parseFloat(line.substring(38, 46).trim());
        const z = parseFloat(line.substring(46, 54).trim());

        // Extract element symbol (column 76-78 or derived from atom name)
        let element = '';
        if (line.length >= 78) {
          element = line.substring(76, 78).trim().toUpperCase();
        }
        if (!element && name) {
          element = name.replace(/[0-9]/g, '').substring(0, 2).trim().toUpperCase();
          if (element.length === 2 && !['CL', 'BR', 'FE', 'ZN', 'MG', 'CA'].includes(element)) {
            element = element[0];
          }
        }

        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(resSeq)) {
          atoms.push({
            recordType,
            serial: isNaN(serial) ? atoms.length + 1 : serial,
            name,
            resName: resName || 'LIG',
            chain,
            resSeq,
            x,
            y,
            z,
            element: element || 'C',
          });
        }
      } catch {
        // Skip malformed individual atom lines
      }
    }

    return atoms;
  },

  /**
   * Calculates Euclidean distance in Ångströms between two 3D points.
   */
  distance(a: AtomRecord, b: AtomRecord): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Checks if an element is a heteroatom capable of forming hydrogen bonds (O, N, F, S).
   */
  isHeteroatom(element: string): boolean {
    const el = element.toUpperCase();
    return el === 'O' || el === 'N' || el === 'F' || el === 'S';
  },

  /**
   * Checks if an element is a non-polar carbon.
   */
  isCarbon(element: string): boolean {
    return element.toUpperCase() === 'C';
  },

  /**
   * Performs geometric contact analysis between protein receptor atoms and ligand pose atoms.
   * STRICT: If coordinates are absent or invalid, marks hasAnalysis: false.
   */
  analyzeInteractions(params: {
    proteinContent?: string;
    ligandCoordinates?: string;
  }): InteractionAnalysisResult {
    const { proteinContent, ligandCoordinates } = params;

    const unavailableResult: InteractionAnalysisResult = {
      hasAnalysis: false,
      interactions: [],
      hydrogenBondsCount: 0,
      hydrophobicContactsCount: 0,
      interactingResiduesCount: 0,
      statusNote: 'Interaction analysis is not available for this docking result.',
    };

    if (!proteinContent || !proteinContent.trim() || !ligandCoordinates || !ligandCoordinates.trim()) {
      return unavailableResult;
    }

    const proteinAtoms = this.parseAtoms(proteinContent);
    const ligandAtoms = this.parseAtoms(ligandCoordinates);

    // If either structure contains no parsable 3D atoms, analysis cannot be run
    if (proteinAtoms.length === 0 || ligandAtoms.length === 0) {
      return unavailableResult;
    }

    const interactions: MolecularInteraction[] = [];
    const interactingResidueKeys = new Set<string>();
    let hydrogenBondsCount = 0;
    let hydrophobicContactsCount = 0;

    // Standard biochemical distance thresholds:
    // Hydrogen bonds: heteroatom-heteroatom distance <= 3.5 Å
    // Hydrophobic contacts: carbon-carbon distance <= 4.0 Å
    // General contact residue cutoff: any atom distance <= 4.0 Å
    const HBOND_CUTOFF = 3.5;
    const HYDROPHOBIC_CUTOFF = 4.0;
    const CONTACT_CUTOFF = 4.0;

    for (const ligAtom of ligandAtoms) {
      for (const protAtom of proteinAtoms) {
        const d = this.distance(ligAtom, protAtom);

        const resKey = `${protAtom.chain}:${protAtom.resName}${protAtom.resSeq}`;

        if (d <= CONTACT_CUTOFF) {
          interactingResidueKeys.add(resKey);
        }

        // Hydrogen bond detection (heteroatom to heteroatom)
        if (d <= HBOND_CUTOFF && this.isHeteroatom(ligAtom.element) && this.isHeteroatom(protAtom.element)) {
          hydrogenBondsCount++;
          interactions.push({
            id: `hbond_${interactions.length + 1}`,
            type: 'HYDROGEN_BOND',
            proteinResidue: protAtom.resName,
            residueNumber: protAtom.resSeq,
            chain: protAtom.chain,
            ligandAtom: ligAtom.name,
            distance: parseFloat(d.toFixed(2)),
            confidence: 0.95,
            description: `H-Bond (${ligAtom.name} ••• ${protAtom.name} of ${protAtom.resName}${protAtom.resSeq})`,
          });
        }
        // Hydrophobic contact detection (carbon to carbon)
        else if (d <= HYDROPHOBIC_CUTOFF && this.isCarbon(ligAtom.element) && this.isCarbon(protAtom.element)) {
          hydrophobicContactsCount++;
          interactions.push({
            id: `hydro_${interactions.length + 1}`,
            type: 'HYDROPHOBIC',
            proteinResidue: protAtom.resName,
            residueNumber: protAtom.resSeq,
            chain: protAtom.chain,
            ligandAtom: ligAtom.name,
            distance: parseFloat(d.toFixed(2)),
            confidence: 0.85,
            description: `Hydrophobic contact (${ligAtom.name} ••• ${protAtom.name} of ${protAtom.resName}${protAtom.resSeq})`,
          });
        }
      }
    }

    return {
      hasAnalysis: true,
      interactions,
      hydrogenBondsCount,
      hydrophobicContactsCount,
      interactingResiduesCount: interactingResidueKeys.size,
      analyzedAt: new Date().toISOString(),
      method: 'Geometric Euclidean Distance Analysis (Cutoff: H-Bond 3.5 Å, Hydrophobic 4.0 Å)',
      statusNote: `${interactions.length} molecular contacts computed from atomic coordinates.`,
    };
  },
};
