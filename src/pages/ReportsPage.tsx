import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Dna,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  Eye,
  History,
  ArrowLeft,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { reportRepository } from '../database/repositories/reportRepository';
import { proteinRepository } from '../database/repositories/proteinRepository';
import { ligandRepository } from '../database/repositories/ligandRepository';
import { dockingRepository } from '../database/repositories/dockingRepository';
import { dockingReportService } from '../services/dockingReportService';
import { useToast } from '../hooks/useToast';
import { formatDate, formatStatusLabel } from '../utils/formatters';
import type {
  Report,
  Protein,
  Ligand,
  DockingJob,
  MolecularDockingReport,
  ReportHistoryItem,
} from '../types';

export const ReportsPage: React.FC = () => {
  const { jobId: routeJobId } = useParams<{ jobId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'docking' | 'history' | 'field'>('docking');
  const [reports, setReports] = useState<Report[]>([]);
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [ligands, setLigands] = useState<Ligand[]>([]);
  const [jobs, setJobs] = useState<DockingJob[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report Generator controls
  const [reportMode, setReportMode] = useState<'job' | 'comparison'>('job');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedProteinId, setSelectedProteinId] = useState<string>('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Report being previewed
  const [activeReport, setActiveReport] = useState<MolecularDockingReport | null>(null);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [reportList, protList, ligList, jobList, histList] = await Promise.all([
          reportRepository.getAll(),
          proteinRepository.getAll(),
          ligandRepository.getAll(),
          dockingRepository.getJobs(),
          dockingReportService.getReportHistory(),
        ]);
        setReports(reportList);
        setProteins(protList);
        setLigands(ligList);
        setJobs(jobList);
        setReportHistory(histList);

        if (protList.length > 0) {
          setSelectedProteinId(protList[0].id);
        }
        if (ligList.length >= 2) {
          setSelectedCandidateIds(ligList.slice(0, 3).map((l) => l.id));
        }

        // Check if query params specify comparison report
        const typeParam = searchParams.get('type');
        const proteinIdParam = searchParams.get('proteinId');
        const candidatesParam = searchParams.get('candidates');

        if (typeParam === 'comparison' && proteinIdParam) {
          setReportMode('comparison');
          setSelectedProteinId(proteinIdParam);
          if (candidatesParam) {
            setSelectedCandidateIds(candidatesParam.split(',').filter(Boolean));
          }
          // Auto generate comparison report preview
          try {
            const candidateIdsToUse = candidatesParam
              ? candidatesParam.split(',').filter(Boolean)
              : ligList.slice(0, 3).map((l) => l.id);
            if (candidateIdsToUse.length >= 2) {
              const compReport = await dockingReportService.generateComparisonReport({
                proteinId: proteinIdParam,
                candidateIds: candidateIdsToUse,
              });
              setActiveReport(compReport);
            }
          } catch (e) {
            console.warn('Comparison report auto-generate notice:', e);
          }
        } else if (routeJobId) {
          // If URL provided a jobId (/reports/:jobId), load it directly
          setSelectedJobId(routeJobId);
          await loadReportForJob(routeJobId);
        } else if (jobList.length > 0) {
          // Default to latest completed job if available, or first job
          const completedJob = jobList.find((j) => j.status === 'COMPLETED');
          if (completedJob) {
            setSelectedJobId(completedJob.jobId || completedJob.id);
            await loadReportForJob(completedJob.jobId || completedJob.id);
          } else {
            setSelectedJobId(jobList[0].jobId || jobList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [routeJobId, searchParams]);

  // Handler to load and generate report for a specific job
  const loadReportForJob = async (jobId: string) => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const report = await dockingReportService.generateReportFromJob(jobId);
      setActiveReport(report);
      // Auto-save generated report to history
      await dockingReportService.saveReportToHistory(report);
      const updatedHistory = await dockingReportService.getReportHistory();
      setReportHistory(updatedHistory);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate docking report.';
      setGenerationError(msg);
      setActiveReport(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReportClick = async () => {
    if (reportMode === 'job') {
      if (!selectedJobId) {
        showToast('Please select a docking job to generate a report', 'warning');
        return;
      }
      await loadReportForJob(selectedJobId);
      if (!generationError) {
        showToast('Generated Molecular Docking Analysis Report preview', 'success');
      }
    } else {
      // Comparison report mode
      if (!selectedProteinId) {
        showToast('Please select a target protein', 'warning');
        return;
      }
      if (selectedCandidateIds.length < 2) {
        showToast('Select at least two candidate molecules for comparison', 'warning');
        return;
      }
      setGenerationError(null);
      setIsGenerating(true);
      try {
        const report = await dockingReportService.generateComparisonReport({
          proteinId: selectedProteinId,
          candidateIds: selectedCandidateIds,
        });
        setActiveReport(report);
        await dockingReportService.saveReportToHistory(report);
        const updatedHistory = await dockingReportService.getReportHistory();
        setReportHistory(updatedHistory);
        showToast('Generated Multi-Candidate Comparison Report preview', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate comparison report.';
        setGenerationError(msg);
        setActiveReport(null);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleExportPDF = (reportToExport?: MolecularDockingReport) => {
    const target = reportToExport || activeReport;
    if (!target) {
      showToast('No active report available to export', 'error');
      return;
    }
    try {
      const { filename } = dockingReportService.exportReportToPDF(target, true);
      showToast(`Exported ${filename}`, 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export report PDF. Check system console.', 'error');
    }
  };

  const handleViewHistoryItem = (item: ReportHistoryItem) => {
    setActiveReport(item.reportData);
    setActiveTab('docking');
    showToast(`Loaded preview for report ${item.id}`, 'info');
  };

  const handleExportFieldReport = (report: Report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.reportNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${report.reportNumber} manifest`, 'success');
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const completedJobs = useMemo(() => {
    return jobs.filter((j) => j.status === 'COMPLETED');
  }, [jobs]);

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'COMPLETED':
      case 'FINALIZED':
        return 'success';
      case 'STANDBY':
      case 'SUBMITTED':
        return 'primary';
      case 'PENDING':
      case 'DRAFT':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Compiling report data repository..." className="h-80" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Scientific Reports & Documentation"
        subtitle="Auditable scientific dossiers for molecular docking experiments, candidate comparisons, and forensic field records"
        actions={
          activeReport && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReport(null)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Controls
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportPDF()}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Generate PDF
              </Button>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cyan-500/30">
        <button
          onClick={() => setActiveTab('docking')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'docking'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-cyan-400/80 hover:text-cyan-100'
          }`}
        >
          <Dna className="w-4 h-4" />
          Molecular Docking Analysis Report
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-cyan-400/80 hover:text-cyan-100'
          }`}
        >
          <History className="w-4 h-4" />
          Report History ({reportHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('field')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'field'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-cyan-400/80 hover:text-cyan-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Field Incident & Chain of Custody ({reports.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MOLECULAR DOCKING REPORT GENERATOR & PREVIEW            */}
      {/* ============================================================== */}
      {activeTab === 'docking' && (
        <div className="space-y-6">
          {/* CONTROL PANEL */}
          <Card className="p-5 border-cyan-500/30/80 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-cyan-50 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-600" />
                    Report Configuration & Data Source
                  </h3>
                  <p className="text-xs text-cyan-400/80">
                    Select a completed docking job or multi-candidate series. Data is sourced strictly from stored records.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-navy-800/60 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode('job');
                      setGenerationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      reportMode === 'job'
                        ? 'bg-navy-900/40 backdrop-blur-md text-brand-600 shadow-xs'
                        : 'text-cyan-300 hover:text-cyan-50'
                    }`}
                  >
                    Single Job Report
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode('comparison');
                      setGenerationError(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      reportMode === 'comparison'
                        ? 'bg-navy-900/40 backdrop-blur-md text-brand-600 shadow-xs'
                        : 'text-cyan-300 hover:text-cyan-50'
                    }`}
                  >
                    Multi-Candidate Comparison Report
                  </button>
                </div>
              </div>

              {/* SINGLE JOB MODE */}
              {reportMode === 'job' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1.5">
                      Select Docking Simulation Job ({completedJobs.length} Completed Available)
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => {
                        setSelectedJobId(e.target.value);
                        setGenerationError(null);
                      }}
                      className="w-full px-3 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {jobs.length === 0 ? (
                        <option value="">No docking jobs found in repository</option>
                      ) : (
                        jobs.map((j) => (
                          <option key={j.id || j.jobId} value={j.jobId || j.id}>
                            [{j.status}] {j.proteinName || 'Protein'} + {j.ligandName || 'Ligand'} (Job: {j.jobId || j.id}) - {formatDate(j.createdAt)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <Button
                      variant="primary"
                      onClick={handleGenerateReportClick}
                      disabled={isGenerating || jobs.length === 0}
                      className="w-full text-xs"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      {isGenerating ? 'Compiling Dossier...' : 'Generate / Refresh Preview'}
                    </Button>
                  </div>
                </div>
              )}

              {/* COMPARISON MODE */}
              {reportMode === 'comparison' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1.5">
                        Target Protein Receptor
                      </label>
                      <select
                        value={selectedProteinId}
                        onChange={(e) => setSelectedProteinId(e.target.value)}
                        className="w-full px-3 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {proteins.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.structureId || 'Local'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1.5">
                        Candidate Molecules ({selectedCandidateIds.length} selected, min 2)
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ligands.map((l) => {
                          const isSelected = selectedCandidateIds.includes(l.id);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => toggleCandidateSelection(l.id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                isSelected
                                  ? 'bg-brand-50 border-brand-500 text-brand-700'
                                  : 'bg-navy-900/40 backdrop-blur-md border-cyan-400/40 text-cyan-300 hover:border-slate-400'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {l.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="primary"
                      onClick={handleGenerateReportClick}
                      disabled={isGenerating || selectedCandidateIds.length < 2}
                      className="w-full sm:w-auto text-xs"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      {isGenerating ? 'Compiling Comparison Matrix...' : 'Generate Multi-Candidate Report'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ERROR ALERT (Requirement: clear rejection for incomplete/missing jobs) */}
          {generationError && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold text-amber-950 text-sm">
                  Report Generation Notice
                </strong>
                <p className="leading-relaxed">{generationError}</p>
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-amber-400 bg-navy-900/40 backdrop-blur-md"
                    onClick={() => navigate('/docking')}
                  >
                    Open Docking Simulation Workspace
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 9: REPORT PREVIEW                                      */}
          {/* ============================================================== */}
          {activeReport && (
            <div className="space-y-4">
              {/* Preview Action Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl shadow-md border border-slate-700/50 relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400">
                      Interactive Report Preview
                    </span>
                    <h2 className="text-sm font-bold text-white">
                      {activeReport.reportTitle} • <span className="font-mono text-brand-300">{activeReport.id}</span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                    onClick={() => setActiveReport(null)}
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleExportPDF()}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Generate PDF
                  </Button>
                </div>
              </div>

              {/* DOSSIER BODY CARD */}
              <Card className="p-6 sm:p-8 space-y-6 border-cyan-500/30 shadow-card-hover bg-navy-900/40 backdrop-blur-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {/* A. PROJECT / REPORT HEADER */}
                <div className="border-b border-cyan-500/30 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        {activeReport.appName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <Badge variant="primary" size="sm">
                        {activeReport.scientificLabel}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-black text-cyan-50 tracking-tight">
                      {activeReport.reportTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cyan-400/80 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        Report ID: <strong className="text-cyan-200">{activeReport.id}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        Job ID: <strong className="text-cyan-200">{activeReport.jobId}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Generated: {formatDate(activeReport.generatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExportPDF()}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Export PDF
                    </Button>
                  </div>
                </div>

                {/* B. TARGET PROTEIN */}
                <div className="bg-navy-950/60 p-5 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80">
                      Target Protein Receptor
                    </span>
                    <Badge variant="success" size="sm">
                      {activeReport.targetProtein.validationStatus || 'VALIDATED'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Protein Name</span>
                      <strong className="text-cyan-50 text-sm">{activeReport.targetProtein.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Structure / PDB ID</span>
                      <span className="font-mono text-cyan-100">
                        {activeReport.targetProtein.structureId || activeReport.targetProtein.id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Input Structure File</span>
                      <span className="font-mono text-cyan-100">{activeReport.targetProtein.filename}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Structure Format</span>
                      <span className="text-cyan-100 font-semibold">{activeReport.targetProtein.format}</span>
                    </div>
                  </div>

                  {/* Binding / Search Region */}
                  <div className="pt-2 border-t border-cyan-500/30">
                    <span className="text-[10px] uppercase font-bold text-cyan-400/80 block mb-1.5">
                      Binding / Search Region Configuration
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-cyan-200">
                      <div className="bg-navy-900/40 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500/30">
                        <span className="text-slate-400 block text-[10px]">Pocket Name</span>
                        <strong className="text-cyan-50">{activeReport.targetProtein.bindingSite.name}</strong>
                      </div>
                      <div className="bg-navy-900/40 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500/30">
                        <span className="text-slate-400 block text-[10px]">Center Coordinates (Å)</span>
                        X: {activeReport.targetProtein.bindingSite.centerX}, Y: {activeReport.targetProtein.bindingSite.centerY}, Z: {activeReport.targetProtein.bindingSite.centerZ}
                      </div>
                      <div className="bg-navy-900/40 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500/30">
                        <span className="text-slate-400 block text-[10px]">Box Dimensions (Å)</span>
                        {activeReport.targetProtein.bindingSite.sizeX} × {activeReport.targetProtein.bindingSite.sizeY} × {activeReport.targetProtein.bindingSite.sizeZ} Å
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. CANDIDATE LIGAND */}
                <div className="bg-navy-950/60 p-5 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80">
                      Candidate Ligand Molecule
                    </span>
                    <Badge variant="primary" size="sm">
                      {activeReport.candidateLigand.validationStatus || 'VALIDATED'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ligand Name</span>
                      <strong className="text-cyan-50 text-sm">{activeReport.candidateLigand.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Chemical / Molecule ID</span>
                      <span className="font-mono text-cyan-100">
                        {activeReport.candidateLigand.chemicalName || activeReport.candidateLigand.id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Input Filename</span>
                      <span className="font-mono text-cyan-100">{activeReport.candidateLigand.filename}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Molecular Format</span>
                      <span className="text-cyan-100 font-semibold">{activeReport.candidateLigand.format}</span>
                    </div>
                  </div>
                </div>

                {/* D. DOCKING CONFIGURATION */}
                <div className="bg-navy-900/40 backdrop-blur-md p-5 rounded-xl border border-cyan-500/30 space-y-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80 block">
                    Docking Simulation Configuration
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                      <span className="text-slate-400 block text-[10px]">Docking Engine</span>
                      <strong className="text-cyan-50">{activeReport.dockingConfiguration.engine}</strong>
                    </div>
                    <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                      <span className="text-slate-400 block text-[10px]">Exhaustiveness</span>
                      <strong className="text-cyan-50">{activeReport.dockingConfiguration.exhaustiveness}</strong>
                    </div>
                    <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                      <span className="text-slate-400 block text-[10px]">Binding Modes</span>
                      <strong className="text-cyan-50">{activeReport.dockingConfiguration.numModes} modes</strong>
                    </div>
                    <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                      <span className="text-slate-400 block text-[10px]">Energy Range</span>
                      <strong className="text-cyan-50">{activeReport.dockingConfiguration.energyRange} kcal/mol</strong>
                    </div>
                  </div>
                </div>

                {/* E. DOCKING RESULTS */}
                <div className="bg-navy-950/60 p-5 rounded-xl border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80">
                      Docking Results & Predicted Poses
                    </span>
                    <Badge variant={getStatusVariant(activeReport.dockingResults.status)} size="sm">
                      {activeReport.dockingResults.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-navy-900/40 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Best Binding Affinity</span>
                      <div className="text-xl font-black text-brand-600 mt-0.5">
                        {activeReport.dockingResults.bestAffinityDisplay}
                      </div>
                      <span className="text-[11px] text-cyan-400/80">Lowest free energy binding mode</span>
                    </div>

                    <div className="bg-navy-900/40 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Optimal Pose Index</span>
                      <div className="text-xl font-bold text-cyan-50 mt-0.5">
                        Pose #{activeReport.dockingResults.poseNumber ?? 1}
                      </div>
                      <span className="text-[11px] text-cyan-400/80">Primary conformation ranked</span>
                    </div>

                    <div className="bg-navy-900/40 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">RMSD Reference</span>
                      <div className="text-xl font-bold text-cyan-50 mt-0.5 font-mono">
                        {activeReport.dockingResults.rmsdLowerBound ?? 0.0} / {activeReport.dockingResults.rmsdUpperBound ?? 0.0} Å
                      </div>
                      <span className="text-[11px] text-cyan-400/80">RMSD lower & upper bounds</span>
                    </div>
                  </div>

                  {/* Poses Table */}
                  {activeReport.dockingResults.availablePoses.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-cyan-500/30 bg-navy-900/40 backdrop-blur-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-navy-800/60 text-cyan-300 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Mode / Pose #</th>
                            <th className="px-3 py-2">Affinity (kcal/mol)</th>
                            <th className="px-3 py-2">RMSD Lower Bound (Å)</th>
                            <th className="px-3 py-2">RMSD Upper Bound (Å)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeReport.dockingResults.availablePoses.map((pose) => (
                            <tr key={pose.mode} className="hover:bg-navy-950/60">
                              <td className="px-3 py-2 font-bold text-cyan-50">Pose #{pose.mode}</td>
                              <td className="px-3 py-2 font-mono text-brand-700 font-bold">{pose.affinity.toFixed(1)}</td>
                              <td className="px-3 py-2 font-mono text-cyan-200">{pose.rmsdLowerBound.toFixed(3)}</td>
                              <td className="px-3 py-2 font-mono text-cyan-200">{pose.rmsdUpperBound.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-cyan-300 italic bg-navy-900/40 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30">
                      {activeReport.dockingResults.statusNote}
                    </p>
                  )}
                </div>

                {/* F. INTERACTION ANALYSIS */}
                <div className="bg-navy-900/40 backdrop-blur-md p-5 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80">
                      Interaction Analysis
                    </span>
                    <Badge variant={activeReport.interactionAnalysis.available ? 'success' : 'neutral'} size="sm">
                      {activeReport.interactionAnalysis.available ? 'ANALYZED' : 'NOT AVAILABLE'}
                    </Badge>
                  </div>

                  {activeReport.interactionAnalysis.available ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                          <span className="text-slate-400 block text-[10px]">Hydrogen Bonds</span>
                          <strong className="text-cyan-50 text-sm">
                            {activeReport.interactionAnalysis.hydrogenBondsCount} detected
                          </strong>
                        </div>
                        <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                          <span className="text-slate-400 block text-[10px]">Hydrophobic Contacts</span>
                          <strong className="text-cyan-50 text-sm">
                            {activeReport.interactionAnalysis.hydrophobicContactsCount} detected
                          </strong>
                        </div>
                        <div className="bg-navy-950/60 p-2.5 rounded-lg border border-cyan-500/30">
                          <span className="text-slate-400 block text-[10px]">Interacting Residues</span>
                          <strong className="text-cyan-50 text-sm">
                            {activeReport.interactionAnalysis.interactingResiduesCount} unique residues
                          </strong>
                        </div>
                      </div>

                      {activeReport.interactionAnalysis.details && activeReport.interactionAnalysis.details.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-cyan-500/30">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-navy-800/60 text-cyan-300 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="px-3 py-2">Contact Type</th>
                                <th className="px-3 py-2">Receptor Residue</th>
                                <th className="px-3 py-2">Distance (Å)</th>
                                <th className="px-3 py-2">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {activeReport.interactionAnalysis.details.map((detail, idx) => (
                                <tr key={idx} className="hover:bg-navy-950/60">
                                  <td className="px-3 py-1.5 font-bold text-cyan-100">{detail.type}</td>
                                  <td className="px-3 py-1.5 font-mono text-cyan-50">{detail.residue}</td>
                                  <td className="px-3 py-1.5 font-mono text-cyan-200">
                                    {detail.distance ? `${detail.distance} Å` : 'N/A'}
                                  </td>
                                  <td className="px-3 py-1.5 text-cyan-300">{detail.description || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                      {activeReport.interactionAnalysis.statusNote}
                    </div>
                  )}
                </div>

                {/* G. 3D VISUALIZATION */}
                <div className="p-4 bg-navy-950/60 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      3D Molecular Visualization
                    </span>
                    <p className="text-cyan-200 font-medium">{activeReport.visualizationNote}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs shrink-0 bg-navy-900/40 backdrop-blur-md"
                    onClick={() => navigate(activeReport.jobId ? `/results/${activeReport.jobId}` : '/results')}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open 3D Viewer
                  </Button>
                </div>

                {/* H. MULTIPLE-CANDIDATE COMPARISON (IF APPLICABLE) */}
                {activeReport.comparisonData && activeReport.comparisonData.rows.length > 0 && (
                  <div className="bg-navy-950/60 p-5 rounded-xl border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-400/80">
                        Candidate Comparison Matrix ({activeReport.comparisonData.rows.length} Candidates Evaluated)
                      </span>
                      <span className="text-[10px] text-slate-400 italic">
                        Standard computational comparison
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-cyan-500/30 bg-navy-900/40 backdrop-blur-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-navy-800/60 text-cyan-300 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Candidate</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Best Score (kcal/mol)</th>
                            <th className="px-3 py-2">Best Pose</th>
                            <th className="px-3 py-2">H-Bonds</th>
                            <th className="px-3 py-2">Hydrophobic</th>
                            <th className="px-3 py-2">Residues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeReport.comparisonData.rows.map((row) => (
                            <tr key={row.candidateId} className="hover:bg-navy-950/60">
                              <td className="px-3 py-2 font-bold text-cyan-50">{row.candidateName}</td>
                              <td className="px-3 py-2">
                                <Badge variant={getStatusVariant(row.dockingStatus)} size="sm">
                                  {row.dockingStatus}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-brand-700">
                                {typeof row.dockingScore === 'number'
                                  ? `${row.dockingScore.toFixed(1)}`
                                  : 'Not available'}
                              </td>
                              <td className="px-3 py-2 text-cyan-200">{row.bestPose || 'Pose #1'}</td>
                              <td className="px-3 py-2 font-mono text-cyan-200">
                                {row.hydrogenBondsCount ?? '—'}
                              </td>
                              <td className="px-3 py-2 font-mono text-cyan-200">
                                {row.hydrophobicContactsCount ?? '—'}
                              </td>
                              <td className="px-3 py-2 font-mono text-cyan-200">
                                {row.interactingResiduesCount ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* I. SCIENTIFIC INTERPRETATION */}
                <div className="p-4 bg-navy-950/60 rounded-xl border border-cyan-500/30 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Scientific Interpretation
                  </span>
                  <p className="text-cyan-200 leading-relaxed">
                    {activeReport.scientificInterpretation}
                  </p>
                </div>

                {/* J. MANDATORY SCIENTIFIC DISCLAIMER */}
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed space-y-0.5">
                    <strong className="block font-bold text-amber-950">
                      Mandatory Scientific Disclaimer:
                    </strong>
                    <p className="text-amber-900">{activeReport.scientificDisclaimer}</p>
                  </div>
                </div>

                {/* Preview Bottom Buttons */}
                <div className="pt-4 border-t border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveReport(null)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => handleExportPDF()}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Generate PDF
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: REPORT HISTORY                                          */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {reportHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Docking Reports Generated Yet"
              description="Generated reports and previews will be preserved here with one-click PDF re-export."
              actionLabel="Create First Report"
              onAction={() => setActiveTab('docking')}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-cyan-400/80 font-medium">
                  {reportHistory.length} generated scientific docking reports on record
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    dockingReportService.clearHistory();
                    setReportHistory([]);
                    showToast('Cleared report history cache', 'info');
                  }}
                >
                  Clear History
                </Button>
              </div>

              {reportHistory.map((item) => (
                <Card key={item.id} className="p-4 hover:border-cyan-400/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-50">{item.id}</span>
                        <Badge variant={getStatusVariant(item.status)} size="sm">
                          {item.status}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">Job: {item.jobId}</span>
                      </div>
                      <h4 className="text-sm font-bold text-cyan-100">
                        {item.targetProtein} + {item.candidateLigand}
                      </h4>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Generated on {formatDate(item.generatedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewHistoryItem(item)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleExportPDF(item.reportData)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FIELD INCIDENT REPORTS (PRESERVED STAGE 1 & 2)           */}
      {/* ============================================================== */}
      {activeTab === 'field' && (
        <>
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Field Reports Generated"
              description="Create your first field incident or chain of custody report."
              actionLabel="Generate Report"
              onAction={() => showToast('Field report creation enabled in settings', 'info')}
            />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-5 hover:border-cyan-400/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-50">
                          {report.reportNumber}
                        </span>
                        <Badge variant={getStatusVariant(report.status)} size="sm">
                          {formatStatusLabel(report.status)}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-cyan-100">{report.title}</h4>
                      <p className="text-xs text-cyan-400/80 max-w-2xl">{report.summary}</p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Generated by {report.generatedBy} on {formatDate(report.generatedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportFieldReport(report)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Export JSON
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
