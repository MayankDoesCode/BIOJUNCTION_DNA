import { db } from '../database/db';
import {
  EXPANDED_PROTEINS,
  EXPANDED_LIGANDS,
  EXPANDED_CASES,
  EXPANDED_SAMPLES,
  EXPANDED_FIELD_TESTS,
  EXPANDED_EVIDENCE,
  EXPANDED_DOCKING_JOBS,
  EXPANDED_DOCKING_RESULTS,
} from '../database/expandedDataset';
import {
  DEMO_USERS,
  DEMO_CASES,
  DEMO_SAMPLES,
  DEMO_FIELD_TESTS,
  DEMO_EVIDENCE,
  DEMO_TEST_RESULTS,
  DEMO_REPORTS,
  DEMO_PROTEINS,
  DEMO_LIGANDS,
} from '../database/seedData';
import type { Protein, Ligand, Case, FieldTest, Sample } from '../types';

export interface DatasetStats {
  proteins: number;
  ligands: number;
  cases: number;
  samples: number;
  fieldTests: number;
  evidence: number;
  dockingJobs: number;
  dockingResults: number;
  totalRecords: number;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  targetTable: string;
  errors: string[];
  warnings: string[];
}

export type ImportTargetTable = 'all' | 'proteins' | 'ligands' | 'cases' | 'fieldTests' | 'samples' | 'docking';

export const datasetService = {
  /**
   * Retrieves live record counts across all primary tables.
   */
  async getStats(): Promise<DatasetStats> {
    const [
      proteins,
      ligands,
      cases,
      samples,
      fieldTests,
      evidence,
      dockingJobs,
      dockingResults,
    ] = await Promise.all([
      db.proteins.count(),
      db.ligands.count(),
      db.cases.count(),
      db.samples.count(),
      db.fieldTests.count(),
      db.evidence.count(),
      db.dockingJobs.count(),
      db.dockingResults.count(),
    ]);

    const totalRecords =
      proteins +
      ligands +
      cases +
      samples +
      fieldTests +
      evidence +
      dockingJobs +
      dockingResults;

    return {
      proteins,
      ligands,
      cases,
      samples,
      fieldTests,
      evidence,
      dockingJobs,
      dockingResults,
      totalRecords,
    };
  },

  /**
   * Loads the comprehensive large enterprise dataset into IndexedDB.
   * Performs bulk upsert (put) so existing records are preserved or updated.
   */
  async loadExpandedDataset(): Promise<{ addedCount: number; stats: DatasetStats }> {
    await db.transaction(
      'rw',
      [
        db.proteins,
        db.ligands,
        db.cases,
        db.samples,
        db.fieldTests,
        db.evidence,
        db.dockingJobs,
        db.dockingResults,
      ],
      async () => {
        // Bulk upsert all expanded records
        await Promise.all([
          db.proteins.bulkPut(EXPANDED_PROTEINS),
          db.ligands.bulkPut(EXPANDED_LIGANDS),
          db.cases.bulkPut(EXPANDED_CASES),
          db.samples.bulkPut(EXPANDED_SAMPLES),
          db.fieldTests.bulkPut(EXPANDED_FIELD_TESTS),
          db.evidence.bulkPut(EXPANDED_EVIDENCE),
          db.dockingJobs.bulkPut(EXPANDED_DOCKING_JOBS),
          db.dockingResults.bulkPut(EXPANDED_DOCKING_RESULTS),
        ]);
      }
    );

    const stats = await this.getStats();
    const addedCount =
      EXPANDED_PROTEINS.length +
      EXPANDED_LIGANDS.length +
      EXPANDED_CASES.length +
      EXPANDED_SAMPLES.length +
      EXPANDED_FIELD_TESTS.length +
      EXPANDED_EVIDENCE.length +
      EXPANDED_DOCKING_JOBS.length +
      EXPANDED_DOCKING_RESULTS.length;

    return { addedCount, stats };
  },

  /**
   * Resets the database to the clean initial demo seed data.
   */
  async resetToInitialDemo(): Promise<DatasetStats> {
    await db.transaction(
      'rw',
      [
        db.users,
        db.proteins,
        db.ligands,
        db.cases,
        db.samples,
        db.fieldTests,
        db.evidence,
        db.testResults,
        db.reports,
        db.dockingJobs,
        db.dockingResults,
      ],
      async () => {
        await Promise.all([
          db.users.clear(),
          db.proteins.clear(),
          db.ligands.clear(),
          db.cases.clear(),
          db.samples.clear(),
          db.fieldTests.clear(),
          db.evidence.clear(),
          db.testResults.clear(),
          db.reports.clear(),
          db.dockingJobs.clear(),
          db.dockingResults.clear(),
        ]);

        await Promise.all([
          db.users.bulkAdd(DEMO_USERS),
          db.proteins.bulkAdd(DEMO_PROTEINS),
          db.ligands.bulkAdd(DEMO_LIGANDS),
          db.cases.bulkAdd(DEMO_CASES),
          db.samples.bulkAdd(DEMO_SAMPLES),
          db.fieldTests.bulkAdd(DEMO_FIELD_TESTS),
          db.evidence.bulkAdd(DEMO_EVIDENCE),
          db.testResults.bulkAdd(DEMO_TEST_RESULTS),
          db.reports.bulkAdd(DEMO_REPORTS),
        ]);
      }
    );

    return this.getStats();
  },

  /**
   * Imports dataset from a JSON string.
   */
  async importFromJSON(jsonString: string, targetTable: ImportTargetTable): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let importedCount = 0;

    try {
      const parsed = JSON.parse(jsonString);

      if (targetTable === 'all' || typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Multi-table bundle import
        const bundle = parsed as Record<string, unknown[]>;
        let count = 0;

        if (Array.isArray(bundle.proteins) && bundle.proteins.length > 0) {
          await db.proteins.bulkPut(bundle.proteins as Protein[]);
          count += bundle.proteins.length;
        }
        if (Array.isArray(bundle.ligands) && bundle.ligands.length > 0) {
          await db.ligands.bulkPut(bundle.ligands as Ligand[]);
          count += bundle.ligands.length;
        }
        if (Array.isArray(bundle.cases) && bundle.cases.length > 0) {
          await db.cases.bulkPut(bundle.cases as Case[]);
          count += bundle.cases.length;
        }
        if (Array.isArray(bundle.samples) && bundle.samples.length > 0) {
          await db.samples.bulkPut(bundle.samples as Sample[]);
          count += bundle.samples.length;
        }
        if (Array.isArray(bundle.fieldTests) && bundle.fieldTests.length > 0) {
          await db.fieldTests.bulkPut(bundle.fieldTests as FieldTest[]);
          count += bundle.fieldTests.length;
        }

        importedCount = count;
      } else if (Array.isArray(parsed)) {
        // Single array import
        if (targetTable === 'proteins') {
          const validated = parsed.map((item, idx) => ({
            id: item.id || `prot_import_${Date.now()}_${idx}`,
            name: item.name || 'Imported Protein',
            structureId: item.structureId || undefined,
            description: item.description || '',
            source: item.source || 'Custom Import',
            fileFormat: item.fileFormat || 'PDBQT',
            uploadDate: item.uploadDate || new Date().toISOString(),
            status: item.status || 'READY',
            organism: item.organism || 'Unknown',
            resolution: item.resolution || 'N/A',
          })) as Protein[];
          await db.proteins.bulkPut(validated);
          importedCount = validated.length;
        } else if (targetTable === 'ligands') {
          const validated = parsed.map((item, idx) => ({
            id: item.id || `lig_import_${Date.now()}_${idx}`,
            name: item.name || 'Imported Molecule',
            chemicalName: item.chemicalName || item.name || '',
            formula: item.formula || '',
            smiles: item.smiles || '',
            molecularWeight: Number(item.molecularWeight) || undefined,
            isDemo: false,
            uploadDate: item.uploadDate || new Date().toISOString(),
            status: item.status || 'READY',
            description: item.description || '',
          })) as Ligand[];
          await db.ligands.bulkPut(validated);
          importedCount = validated.length;
        } else if (targetTable === 'cases') {
          const validated = parsed.map((item, idx) => ({
            id: item.id || `case_import_${Date.now()}_${idx}`,
            caseNumber: item.caseNumber || `CASE-${Date.now().toString().slice(-4)}-${idx + 1}`,
            title: item.title || 'Imported Case',
            description: item.description || '',
            status: item.status || 'OPEN',
            priority: item.priority || 'MEDIUM',
            location: item.location || { address: 'Field Location' },
            createdBy: item.createdBy || 'usr_001',
            assignedOfficer: item.assignedOfficer || 'Specialist J. Miller',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })) as Case[];
          await db.cases.bulkPut(validated);
          importedCount = validated.length;
        } else {
          errors.push(`Please specify a valid collection target table for array data.`);
        }
      } else {
        errors.push('Unrecognized JSON structure. Expected array or database bundle object.');
      }
    } catch (err) {
      errors.push(`Invalid JSON formatting: ${(err as Error).message}`);
    }

    return {
      success: errors.length === 0,
      importedCount,
      targetTable,
      errors,
      warnings,
    };
  },

  /**
   * Imports dataset from a CSV text string.
   */
  async importFromCSV(csvString: string, targetTable: ImportTargetTable): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let importedCount = 0;

    const rows = parseCSV(csvString);
    if (rows.length < 2) {
      return {
        success: false,
        importedCount: 0,
        targetTable,
        errors: ['CSV file is empty or missing data rows.'],
        warnings: [],
      };
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1).filter((r) => r.some((val) => val.trim().length > 0));

    try {
      if (targetTable === 'proteins') {
        const nameIdx = headers.indexOf('name');
        const pdbIdx = headers.findIndex((h) => h === 'structureid' || h === 'pdb' || h === 'pdbid');
        const orgIdx = headers.findIndex((h) => h === 'organism' || h === 'source');
        const resIdx = headers.indexOf('resolution');
        const descIdx = headers.indexOf('description');

        if (nameIdx === -1) {
          throw new Error('CSV must include a "name" column for proteins.');
        }

        const proteins: Protein[] = dataRows.map((cols, idx) => ({
          id: `prot_csv_${Date.now()}_${idx}`,
          name: cols[nameIdx] || `Target Protein ${idx + 1}`,
          structureId: pdbIdx !== -1 ? cols[pdbIdx] : undefined,
          organism: orgIdx !== -1 ? cols[orgIdx] : 'Reference',
          resolution: resIdx !== -1 ? cols[resIdx] : '2.0 Å',
          description: descIdx !== -1 ? cols[descIdx] : 'Imported via CSV batch processor',
          source: 'CSV Dataset Batch Import',
          fileFormat: 'PDBQT',
          status: 'READY',
          uploadDate: new Date().toISOString(),
        }));

        await db.proteins.bulkPut(proteins);
        importedCount = proteins.length;
      } else if (targetTable === 'ligands') {
        const nameIdx = headers.indexOf('name');
        const chemIdx = headers.findIndex((h) => h === 'chemicalname' || h === 'iupac');
        const formIdx = headers.indexOf('formula');
        const smilesIdx = headers.indexOf('smiles');
        const mwIdx = headers.findIndex((h) => h === 'molecularweight' || h === 'mw');
        const descIdx = headers.indexOf('description');

        if (nameIdx === -1) {
          throw new Error('CSV must include a "name" column for ligands/molecules.');
        }

        const ligands: Ligand[] = dataRows.map((cols, idx) => ({
          id: `lig_csv_${Date.now()}_${idx}`,
          name: cols[nameIdx] || `Candidate Molecule ${idx + 1}`,
          chemicalName: chemIdx !== -1 ? cols[chemIdx] : cols[nameIdx],
          formula: formIdx !== -1 ? cols[formIdx] : '',
          smiles: smilesIdx !== -1 ? cols[smilesIdx] : '',
          molecularWeight: mwIdx !== -1 && !isNaN(Number(cols[mwIdx])) ? Number(cols[mwIdx]) : undefined,
          description: descIdx !== -1 ? cols[descIdx] : 'Imported via CSV batch processor',
          isDemo: false,
          status: 'READY',
          uploadDate: new Date().toISOString(),
        }));

        await db.ligands.bulkPut(ligands);
        importedCount = ligands.length;
      } else if (targetTable === 'cases') {
        const numIdx = headers.findIndex((h) => h === 'casenumber' || h === 'case_number');
        const titleIdx = headers.indexOf('title');
        const statusIdx = headers.indexOf('status');
        const prioIdx = headers.indexOf('priority');
        const locIdx = headers.findIndex((h) => h === 'location' || h === 'address');
        const officerIdx = headers.findIndex((h) => h === 'assignedofficer' || h === 'officer');
        const descIdx = headers.indexOf('description');

        if (titleIdx === -1) {
          throw new Error('CSV must include a "title" column for cases.');
        }

        const cases: Case[] = dataRows.map((cols, idx) => ({
          id: `case_csv_${Date.now()}_${idx}`,
          caseNumber: numIdx !== -1 && cols[numIdx] ? cols[numIdx] : `CASE-2026-IMP-${idx + 1}`,
          title: cols[titleIdx] || `Field Investigation #${idx + 1}`,
          description: descIdx !== -1 ? cols[descIdx] : '',
          status: statusIdx !== -1 && cols[statusIdx] ? (cols[statusIdx].toUpperCase() as Case['status']) : 'OPEN',
          priority: prioIdx !== -1 && cols[prioIdx] ? (cols[prioIdx].toUpperCase() as Case['priority']) : 'MEDIUM',
          location: { address: locIdx !== -1 ? cols[locIdx] : 'Field Operation Area' },
          createdBy: 'usr_001',
          assignedOfficer: officerIdx !== -1 ? cols[officerIdx] : 'Specialist J. Miller',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        await db.cases.bulkPut(cases);
        importedCount = cases.length;
      } else {
        errors.push(`Target table "${targetTable}" is not supported for CSV import. Please select Proteins, Ligands, or Cases.`);
      }
    } catch (err) {
      errors.push((err as Error).message);
    }

    return {
      success: errors.length === 0,
      importedCount,
      targetTable,
      errors,
      warnings,
    };
  },

  /**
   * Generates a downloadable JSON export of requested tables.
   */
  async exportToJSON(table: ImportTargetTable = 'all'): Promise<string> {
    if (table === 'proteins') {
      const data = await db.proteins.toArray();
      return JSON.stringify(data, null, 2);
    }
    if (table === 'ligands') {
      const data = await db.ligands.toArray();
      return JSON.stringify(data, null, 2);
    }
    if (table === 'cases') {
      const data = await db.cases.toArray();
      return JSON.stringify(data, null, 2);
    }
    if (table === 'docking') {
      const [jobs, results] = await Promise.all([
        db.dockingJobs.toArray(),
        db.dockingResults.toArray(),
      ]);
      return JSON.stringify({ jobs, results }, null, 2);
    }

    // All tables bundle
    const [proteins, ligands, cases, samples, fieldTests, evidence, dockingJobs, dockingResults] =
      await Promise.all([
        db.proteins.toArray(),
        db.ligands.toArray(),
        db.cases.toArray(),
        db.samples.toArray(),
        db.fieldTests.toArray(),
        db.evidence.toArray(),
        db.dockingJobs.toArray(),
        db.dockingResults.toArray(),
      ]);

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '2.6',
        proteins,
        ligands,
        cases,
        samples,
        fieldTests,
        evidence,
        dockingJobs,
        dockingResults,
      },
      null,
      2
    );
  },

  /**
   * Generates a downloadable CSV representation for a given table.
   */
  async exportToCSV(table: 'proteins' | 'ligands' | 'cases'): Promise<string> {
    if (table === 'proteins') {
      const items = await db.proteins.toArray();
      const headers = ['id', 'name', 'structureId', 'organism', 'resolution', 'source', 'status', 'description'];
      const lines = [headers.join(',')];
      for (const p of items) {
        lines.push(
          [
            escapeCSV(p.id),
            escapeCSV(p.name),
            escapeCSV(p.structureId || ''),
            escapeCSV(p.organism || ''),
            escapeCSV(p.resolution || ''),
            escapeCSV(p.source || ''),
            escapeCSV(p.status || ''),
            escapeCSV(p.description || ''),
          ].join(',')
        );
      }
      return lines.join('\n');
    }

    if (table === 'ligands') {
      const items = await db.ligands.toArray();
      const headers = ['id', 'name', 'chemicalName', 'formula', 'smiles', 'molecularWeight', 'status', 'description'];
      const lines = [headers.join(',')];
      for (const l of items) {
        lines.push(
          [
            escapeCSV(l.id),
            escapeCSV(l.name),
            escapeCSV(l.chemicalName || ''),
            escapeCSV(l.formula || ''),
            escapeCSV(l.smiles || ''),
            escapeCSV(l.molecularWeight ? String(l.molecularWeight) : ''),
            escapeCSV(l.status || ''),
            escapeCSV(l.description || ''),
          ].join(',')
        );
      }
      return lines.join('\n');
    }

    if (table === 'cases') {
      const items = await db.cases.toArray();
      const headers = ['caseNumber', 'title', 'status', 'priority', 'assignedOfficer', 'location', 'description'];
      const lines = [headers.join(',')];
      for (const c of items) {
        lines.push(
          [
            escapeCSV(c.caseNumber),
            escapeCSV(c.title),
            escapeCSV(c.status),
            escapeCSV(c.priority),
            escapeCSV(c.assignedOfficer || ''),
            escapeCSV(c.location?.address || ''),
            escapeCSV(c.description || ''),
          ].join(',')
        );
      }
      return lines.join('\n');
    }

    return '';
  },

  /**
   * Provides ready-to-use sample templates for user reference.
   */
  getSampleTemplate(format: 'json' | 'csv', table: ImportTargetTable): string {
    if (format === 'csv') {
      if (table === 'proteins') {
        return `name,structureId,organism,resolution,description
"Human Serum Albumin",1AO6,"Homo sapiens","2.5 Å","Abundant circulating transport protein in human blood plasma"
"Beta-2 Adrenergic Receptor",2RH1,"Homo sapiens","2.4 Å","G-protein coupled receptor controlling airway smooth muscle relaxation"
"Penicillin-Binding Protein 2a",1VQQ,"Staphylococcus aureus","2.35 Å","Methicillin resistance conferring transpeptidase enzyme"`;
      }
      if (table === 'ligands') {
        return `name,chemicalName,formula,smiles,molecularWeight,description
"Salbutamol (Albuterol)","4-[2-(tert-butylamino)-1-hydroxyethyl]-2-(hydroxymethyl)phenol",C13H21NO3,"CC(C)(C)NCC(C1=CC(=C(C=C1)O)CO)O",239.31,"Short-acting selective beta-2 adrenergic receptor agonist bronchodilator"
"Atorvastatin (Lipitor)","[R-(R*,R*)]-2-(4-fluorophenyl)-beta,delta-dihydroxy-5-(1-methylethyl)-3-phenyl-4-[(phenylamino)carbonyl]-1H-pyrrole-1-heptanoic acid",C33H35FN2O5,"CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",558.64,"Competitive HMG-CoA reductase inhibitor lowering atherogenic lipoproteins"
"Amoxicillin","(2S,5R,6R)-6-[[(2R)-2-amino-2-(4-hydroxyphenyl)acetyl]amino]-3,3-dimethyl-7-oxo-4-thia-1-azabicyclo[3.2.0]heptane-2-carboxylic acid",C16H19N3O5S,"CC1(C(N2C(S1)C(C2=O)NC(=O)C(C3=CC=C(C=C3)O)N)C(=O)O)C",365.40,"Moderate-spectrum bactericidal beta-lactam aminopenicillin"`;
      }
      return `caseNumber,title,status,priority,assignedOfficer,location,description
"CASE-2026-TX-099","Suspected Warehouse Chemical Cache",OPEN,HIGH,"Specialist J. Miller","Port Warehouse B-7, Corpus Christi, TX","Initial seizure of 14 drums containing precursor esters"
"CASE-2026-TX-100","Border Rail Cargo Screening #12",IN_PROGRESS,CRITICAL,"Officer S. Chen","Laredo Intermodal Yard, Laredo, TX","Discrepancy in seal tags on intermodal rail container"`;
    }

    // JSON template
    if (table === 'proteins') {
      return JSON.stringify(
        [
          {
            name: 'Human Serum Albumin',
            structureId: '1AO6',
            organism: 'Homo sapiens',
            resolution: '2.5 Å',
            source: 'RCSB PDB Reference',
            description: 'Abundant transport protein in human blood plasma.',
          },
          {
            name: 'Beta-2 Adrenergic Receptor',
            structureId: '2RH1',
            organism: 'Homo sapiens',
            resolution: '2.4 Å',
            source: 'RCSB PDB Reference',
            description: 'GPCR controlling airway relaxation.',
          },
        ],
        null,
        2
      );
    }
    if (table === 'ligands') {
      return JSON.stringify(
        [
          {
            name: 'Salbutamol (Albuterol)',
            chemicalName: '4-[2-(tert-butylamino)-1-hydroxyethyl]-2-(hydroxymethyl)phenol',
            formula: 'C13H21NO3',
            smiles: 'CC(C)(C)NCC(C1=CC(=C(C=C1)O)CO)O',
            molecularWeight: 239.31,
            description: 'Beta-2 adrenergic receptor agonist.',
          },
          {
            name: 'Atorvastatin',
            chemicalName: 'Lipitor Active Substance',
            formula: 'C33H35FN2O5',
            molecularWeight: 558.64,
            description: 'HMG-CoA reductase inhibitor.',
          },
        ],
        null,
        2
      );
    }
    return JSON.stringify(
      [
        {
          caseNumber: 'CASE-2026-CUSTOM-001',
          title: 'Custom Forensic Field Seizure',
          status: 'OPEN',
          priority: 'HIGH',
          assignedOfficer: 'Specialist J. Miller',
          location: { address: 'Houston Field Site #4' },
          description: 'Custom field case created for verification.',
        },
      ],
      null,
      2
    );
  },
};

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let col = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        col += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(col.trim());
      col = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(col.trim());
      if (row.length > 0 && row.some((c) => c.length > 0)) {
        result.push(row);
      }
      row = [];
      col = '';
    } else {
      col += char;
    }
  }

  if (col.length > 0 || row.length > 0) {
    row.push(col.trim());
    if (row.some((c) => c.length > 0)) {
      result.push(row);
    }
  }

  return result;
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
