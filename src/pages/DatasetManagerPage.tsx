import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Dna,
  Pill,
  Briefcase,
  Crosshair,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import {
  datasetService,
  type DatasetStats,
  type ImportTargetTable,
} from '../services/datasetService';
import { db } from '../database/db';
import type { Protein, Ligand, Case } from '../types';

export const DatasetManagerPage: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Import state
  const [targetTable, setTargetTable] = useState<ImportTargetTable>('proteins');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Explorer state
  const [activeTab, setActiveTab] = useState<'proteins' | 'ligands' | 'cases'>('proteins');
  const [explorerSearch, setExplorerSearch] = useState('');
  const [proteinsList, setProteinsList] = useState<Protein[]>([]);
  const [ligandsList, setLigandsList] = useState<Ligand[]>([]);
  const [casesList, setCasesList] = useState<Case[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const currentStats = await datasetService.getStats();
      setStats(currentStats);

      const [p, l, c] = await Promise.all([
        db.proteins.toArray(),
        db.ligands.toArray(),
        db.cases.toArray(),
      ]);
      setProteinsList(p);
      setLigandsList(l);
      setCasesList(c);
    } catch (err) {
      console.error('Failed to load dataset stats', err);
      showToast('Error reading database records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // One-click load large enterprise dataset
  const handleLoadExpandedDataset = async () => {
    try {
      setIsExpanding(true);
      const result = await datasetService.loadExpandedDataset();
      setStats(result.stats);
      await loadData();
      showToast(
        `Successfully loaded ${result.addedCount} enterprise dataset records into IndexedDB!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to load expanded dataset', 'error');
    } finally {
      setIsExpanding(false);
    }
  };

  // Reset to initial demo state
  const handleResetToDemo = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all records to the baseline demo dataset? Any custom uploaded data will be cleared.'
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      const newStats = await datasetService.resetToInitialDemo();
      setStats(newStats);
      await loadData();
      showToast('Database reset to clean baseline demo set', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset database', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    setImportFormat(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parsePreview(content, isJson ? 'json' : 'csv');
    };
    reader.readAsText(file);
  };

  const parsePreview = (content: string, format: 'csv' | 'json') => {
    setImportErrors([]);
    setImportSuccessMessage(null);
    try {
      if (format === 'json') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setPreviewRows(parsed.slice(0, 5));
        } else if (typeof parsed === 'object') {
          // Bundle
          const keys = Object.keys(parsed);
          setPreviewRows([{ note: `Database Bundle containing tables: ${keys.join(', ')}` }]);
        }
      } else {
        // Quick preview for CSV
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
          const rows = lines.slice(1, 6).map((line) => {
            const vals = line.split(',').map((v) => v.replace(/"/g, '').trim());
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = vals[i] || '';
            });
            return obj;
          });
          setPreviewRows(rows);
        }
      }
    } catch (err) {
      setImportErrors([`Parse preview failed: ${(err as Error).message}`]);
      setPreviewRows([]);
    }
  };

  const handleExecuteImport = async () => {
    if (!rawText.trim()) {
      showToast('Please upload a file or paste dataset content first.', 'error');
      return;
    }

    try {
      setIsImporting(true);
      setImportErrors([]);
      setImportSuccessMessage(null);

      const res =
        importFormat === 'json'
          ? await datasetService.importFromJSON(rawText, targetTable)
          : await datasetService.importFromCSV(rawText, targetTable);

      if (!res.success || res.errors.length > 0) {
        setImportErrors(res.errors);
        showToast('Import completed with errors. See details below.', 'error');
      } else {
        setImportSuccessMessage(`Successfully imported ${res.importedCount} records into ${res.targetTable}!`);
        showToast(`Imported ${res.importedCount} records!`, 'success');
        setRawText('');
        setFileName(null);
        setPreviewRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadData();
      }
    } catch (err) {
      setImportErrors([(err as Error).message]);
      showToast('Unexpected import failure', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    const template = datasetService.getSampleTemplate(format, targetTable);
    const blob = new Blob([template], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biojunction_${targetTable}_template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded sample ${targetTable} ${format.toUpperCase()} template`, 'info');
  };

  const handleExportJSON = async () => {
    try {
      const dataStr = await datasetService.exportToJSON('all');
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biojunction_full_dataset_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Full database JSON exported successfully', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const handleExportCSV = async (table: 'proteins' | 'ligands' | 'cases') => {
    try {
      const csvStr = await datasetService.exportToCSV(table);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biojunction_${table}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${table} CSV successfully`, 'success');
    } catch (err) {
      showToast('CSV export failed', 'error');
    }
  };

  // Filtered lists for explorer
  const filteredProteins = proteinsList.filter(
    (p) =>
      p.name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
      (p.structureId && p.structureId.toLowerCase().includes(explorerSearch.toLowerCase())) ||
      (p.organism && p.organism.toLowerCase().includes(explorerSearch.toLowerCase()))
  );

  const filteredLigands = ligandsList.filter(
    (l) =>
      l.name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
      (l.chemicalName && l.chemicalName.toLowerCase().includes(explorerSearch.toLowerCase())) ||
      (l.formula && l.formula.toLowerCase().includes(explorerSearch.toLowerCase()))
  );

  const filteredCases = casesList.filter(
    (c) =>
      c.caseNumber.toLowerCase().includes(explorerSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(explorerSearch.toLowerCase()) ||
      (c.location?.address && c.location.address.toLowerCase().includes(explorerSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Dataset Management & Batch Importer"
        subtitle="Expand local IndexedDB storage with rich scientific & forensic libraries or batch import custom CSV / JSON datasets."
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportJSON}
            >
              Export JSON Backup
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={handleResetToDemo}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset to Demo'}
            </Button>
          </div>
        }
      />

      {/* Live Record Counts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Proteins (PDB)</span>
            <Dna className="w-4 h-4 text-[#a71d31]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-luxury-maroon">
              {isLoading ? '...' : stats?.proteins ?? 0}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Stored</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Ligands / Drugs</span>
            <Pill className="w-4 h-4 text-[#a71d31]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-luxury-maroon">
              {isLoading ? '...' : stats?.ligands ?? 0}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Stored</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Docking Runs</span>
            <Crosshair className="w-4 h-4 text-[#a71d31]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-luxury-maroon">
              {isLoading ? '...' : stats?.dockingJobs ?? 0}
            </span>
            <span className="text-[10px] text-luxury-gold font-bold">Simulated</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Field Cases</span>
            <Briefcase className="w-4 h-4 text-[#a71d31]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-luxury-maroon">
              {isLoading ? '...' : stats?.cases ?? 0}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Samples & Tests</span>
            <FileSpreadsheet className="w-4 h-4 text-[#a71d31]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-luxury-maroon">
              {isLoading ? '...' : (stats?.samples ?? 0) + (stats?.fieldTests ?? 0)}
            </span>
            <span className="text-[10px] text-luxury-gold font-bold">Custody</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a0509] to-[#3f0d12] text-white rounded-2xl p-4 border border-[#d5bf86]/30 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#d5bf86] text-xs font-bold">
            <span>Total Records</span>
            <Database className="w-4 h-4 text-[#d5bf86]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {isLoading ? '...' : stats?.totalRecords ?? 0}
            </span>
            <span className="text-[10px] text-[#d5bf86]/80 font-mono">IndexedDB</span>
          </div>
        </div>
      </div>

      {/* Hero Section: One-Click Large Dataset Loader */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a0509] via-[#2a0810] to-[#1a0509] border border-[#d5bf86]/40 shadow-xl p-6 sm:p-8 text-[#f1f0cc]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#a71d31]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a71d31]/30 border border-[#a71d31]/50 text-xs font-bold text-[#d5bf86] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Pre-Engineered Large Enterprise Dataset
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Instant 1-Click Large Dataset Population
            </h2>
            <p className="text-sm text-[#f1f0cc]/80 leading-relaxed">
              Inject over <strong className="text-white">150+ realistic verified scientific records</strong> directly
              into client-side IndexedDB: 20 target proteins across oncology, virology, and neurology; 20 small-molecule
              ligands with chemical structures and SMILES; 10 forensic field seizure cases; and 6 complete docking benchmark
              simulations with interaction scoring.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-[#d5bf86]/20 text-[#d5bf86] font-mono">
                ✓ 20 PDB Receptors (EGFR, Mpro, AChE, MOR)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-[#d5bf86]/20 text-[#d5bf86] font-mono">
                ✓ 20 Ligands (Paxlovid, Imatinib, Fentanyl Std)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-[#d5bf86]/20 text-[#d5bf86] font-mono">
                ✓ AutoDock Vina Benchmarks
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-[#a71d31] to-[#731322] hover:from-[#c2243b] hover:to-[#8a1729] text-white shadow-lg border border-[#d5bf86]/40 text-base font-bold py-3.5 px-6"
              leftIcon={isExpanding ? <LoadingSpinner size="sm" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
              onClick={handleLoadExpandedDataset}
              disabled={isExpanding}
            >
              {isExpanding ? 'Injecting 150+ Records...' : 'Load Large Dataset (150+ Records)'}
            </Button>
            <span className="text-[11px] text-center text-[#d5bf86]/70">
              Safe upsert — updates without deleting your current records
            </span>
          </div>
        </div>
      </div>

      {/* Batch Import Tool (CSV & JSON) */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-base font-bold text-luxury-maroon">Batch Dataset Importer</h3>
          <p className="text-xs text-luxury-taupe">Upload custom CSV or JSON files to expand proteins, candidate molecules, or forensic case logs.</p>
        </div>
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-luxury-cream/50 border border-[#d5bf86]/30">
            <div>
              <label className="block text-xs font-bold text-luxury-maroon mb-1.5">
                Target Collection
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 bg-white text-xs font-semibold text-luxury-maroon focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value as ImportTargetTable)}
              >
                <option value="proteins">Target Proteins (PDB structures)</option>
                <option value="ligands">Candidate Ligands (Molecules/Drugs)</option>
                <option value="cases">Forensic Cases & Operations</option>
                <option value="all">Full Database Bundle (JSON only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-luxury-maroon mb-1.5">
                File Format
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportFormat('csv')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    importFormat === 'csv'
                      ? 'bg-luxury-crimson text-white border-luxury-crimson shadow-xs'
                      : 'bg-white text-luxury-taupe border-[#d5bf86]/60 hover:bg-luxury-gold/10'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat('json')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    importFormat === 'json'
                      ? 'bg-luxury-crimson text-white border-luxury-crimson shadow-xs'
                      : 'bg-white text-luxury-taupe border-[#d5bf86]/60 hover:bg-luxury-gold/10'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  JSON
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleDownloadTemplate(importFormat)}
              >
                Download Sample {importFormat.toUpperCase()} Template
              </Button>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d5bf86]/60 hover:border-luxury-crimson rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-white/60 hover:bg-white flex flex-col items-center justify-center gap-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="w-12 h-12 rounded-full bg-luxury-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-luxury-crimson" />
            </div>
            <div className="text-sm font-bold text-luxury-maroon">
              {fileName ? (
                <span className="text-emerald-700">Selected: {fileName}</span>
              ) : (
                'Drop CSV or JSON dataset here, or click to browse'
              )}
            </div>
            <div className="text-xs text-luxury-taupe">
              Supports standard tabular CSV or JSON arrays for automated batch ingestion.
            </div>
          </div>

          {/* Raw Text Input (Fallback / Paste) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-luxury-maroon">
                Or Paste Dataset Content Directly:
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setFileName(null);
                    setPreviewRows([]);
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Clear Content
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                parsePreview(e.target.value, importFormat);
              }}
              placeholder={`Paste your ${importFormat.toUpperCase()} data here...`}
              className="w-full p-3 rounded-xl border border-[#d5bf86]/60 font-mono text-xs text-luxury-maroon bg-white/90 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
            />
          </div>

          {/* Validation Feedback */}
          {importErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Validation Errors Detected
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {importSuccessMessage}
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-luxury-maroon">
                <span>Preview (First {previewRows.length} Rows):</span>
                <span className="text-emerald-700 font-mono">Format Verified</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#d5bf86]/40 bg-white">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1a0509] text-[#f1f0cc]">
                    <tr>
                      {Object.keys(previewRows[0]).map((col) => (
                        <th key={col} className="p-2.5 uppercase tracking-wider text-[10px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-luxury-gold/5">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-luxury-maroon max-w-xs truncate">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="primary"
              leftIcon={isImporting ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
              onClick={handleExecuteImport}
              disabled={isImporting || !rawText.trim()}
              className="bg-luxury-crimson hover:bg-luxury-maroon text-white font-bold"
            >
              {isImporting ? 'Ingesting Dataset Records...' : 'Import Dataset into IndexedDB'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Dataset Explorer Tabs */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#d5bf86]/30">
          <div>
            <h3 className="text-base font-bold text-luxury-maroon">Live Dataset Explorer</h3>
            <p className="text-xs text-luxury-taupe">Inspect and search all records currently stored in your client-side IndexedDB.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-luxury-taupe absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stored records..."
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#d5bf86]/60 bg-white focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => handleExportCSV(activeTab)}
            >
              Export Tab CSV
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-[#d5bf86]/40 gap-2">
            <button
              onClick={() => setActiveTab('proteins')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'proteins'
                  ? 'border-luxury-crimson text-luxury-crimson'
                  : 'border-transparent text-luxury-taupe hover:text-luxury-maroon'
              }`}
            >
              <Dna className="w-4 h-4" />
              Target Proteins ({proteinsList.length})
            </button>
            <button
              onClick={() => setActiveTab('ligands')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'ligands'
                  ? 'border-luxury-crimson text-luxury-crimson'
                  : 'border-transparent text-luxury-taupe hover:text-luxury-maroon'
              }`}
            >
              <Pill className="w-4 h-4" />
              Candidate Molecules ({ligandsList.length})
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'cases'
                  ? 'border-luxury-crimson text-luxury-crimson'
                  : 'border-transparent text-luxury-taupe hover:text-luxury-maroon'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Forensic Cases ({casesList.length})
            </button>
          </div>

          {/* Proteins Table */}
          {activeTab === 'proteins' && (
            <div className="overflow-x-auto rounded-xl border border-[#d5bf86]/30">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a0509] text-[#f1f0cc]">
                  <tr>
                    <th className="p-3">Protein Target</th>
                    <th className="p-3">PDB ID</th>
                    <th className="p-3">Organism</th>
                    <th className="p-3">Resolution</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProteins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-luxury-taupe">
                        No target proteins found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredProteins.map((p) => (
                      <tr key={p.id} className="hover:bg-luxury-cream/30">
                        <td className="p-3 font-semibold text-luxury-maroon">
                          <div>{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-luxury-taupe font-normal truncate max-w-md">
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-luxury-crimson">
                          {p.structureId || 'Custom'}
                        </td>
                        <td className="p-3 text-luxury-taupe italic">{p.organism || 'N/A'}</td>
                        <td className="p-3 font-mono">{p.resolution || '2.0 Å'}</td>
                        <td className="p-3 text-luxury-taupe">{p.source}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Ligands Table */}
          {activeTab === 'ligands' && (
            <div className="overflow-x-auto rounded-xl border border-[#d5bf86]/30">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a0509] text-[#f1f0cc]">
                  <tr>
                    <th className="p-3">Molecule / Drug Name</th>
                    <th className="p-3">Chemical Formula</th>
                    <th className="p-3">Mol. Weight</th>
                    <th className="p-3">SMILES Notation</th>
                    <th className="p-3">Class / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLigands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-luxury-taupe">
                        No candidate molecules found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredLigands.map((l) => (
                      <tr key={l.id} className="hover:bg-luxury-cream/30">
                        <td className="p-3 font-semibold text-luxury-maroon">
                          <div>{l.name}</div>
                          {l.chemicalName && (
                            <div className="text-[11px] text-luxury-taupe font-normal truncate max-w-sm">
                              {l.chemicalName}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-luxury-maroon font-bold">
                          {l.formula || 'N/A'}
                        </td>
                        <td className="p-3 font-mono">
                          {l.molecularWeight ? `${l.molecularWeight} g/mol` : '—'}
                        </td>
                        <td className="p-3 font-mono text-luxury-taupe max-w-xs truncate" title={l.smiles}>
                          {l.smiles || '—'}
                        </td>
                        <td className="p-3">
                          {l.isDemo ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Demo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              Validated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Cases Table */}
          {activeTab === 'cases' && (
            <div className="overflow-x-auto rounded-xl border border-[#d5bf86]/30">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a0509] text-[#f1f0cc]">
                  <tr>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Operation Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-luxury-taupe">
                        No forensic cases found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-luxury-cream/30">
                        <td className="p-3 font-mono font-bold text-luxury-crimson">
                          {c.caseNumber}
                        </td>
                        <td className="p-3 font-semibold text-luxury-maroon">
                          <div>{c.title}</div>
                          {c.description && (
                            <div className="text-[11px] text-luxury-taupe font-normal truncate max-w-sm">
                              {c.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'TEST_COMPLETED' || c.status === 'CLOSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : c.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3 text-luxury-maroon">{c.assignedOfficer || 'Unassigned'}</td>
                        <td className="p-3 text-luxury-taupe truncate max-w-xs">
                          {c.location?.address || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
