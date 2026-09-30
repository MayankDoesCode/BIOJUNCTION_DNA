import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Crosshair,
  BarChart3,
  AlertCircle,
  FileText,
  ChevronRight,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Dna,
  Pill,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { MolecularViewer } from '../components/molecular/MolecularViewer';
import { InteractionAnalysisPanel } from '../components/molecular/InteractionAnalysisPanel';
import { dockingRepository } from '../database/repositories/dockingRepository';
import { proteinRepository } from '../database/repositories/proteinRepository';
import { ligandRepository } from '../database/repositories/ligandRepository';
import { dockingService, type DockingEngineStatus } from '../services/dockingService';
import { interactionAnalysisService } from '../services/interactionAnalysisService';
import { formatShortDate } from '../utils/formatters';
import type { DockingResult, DockingJob, Protein, Ligand } from '../types';

export const ResultsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<DockingResult[]>([]);
  const [jobs, setJobs] = useState<DockingJob[]>([]);
  const [selectedResult, setSelectedResult] = useState<DockingResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<DockingJob | null>(null);
  const [proteinRecord, setProteinRecord] = useState<Protein | null>(null);
  const [ligandRecord, setLigandRecord] = useState<Ligand | null>(null);
  const [engineStatus, setEngineStatus] = useState<DockingEngineStatus | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active pose selection (Requirement 3)
  const [selectedPoseIndex, setSelectedPoseIndex] = useState(0);
  const [highlightedResidue, setHighlightedResidue] = useState<{ resName: string; resSeq: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [resList, jobList, status] = await Promise.all([
          dockingRepository.getResults(),
          dockingRepository.getJobs(),
          dockingService.checkEngineStatus(),
        ]);

        setResults(resList);
        setJobs(jobList);
        setEngineStatus(status);

        // Determine which item to select
        let currentR: DockingResult | null = null;
        let currentJ: DockingJob | null = null;

        if (jobId) {
          const matchRes = resList.find((r) => r.jobId === jobId || r.id === jobId);
          const matchJob = jobList.find((j) => j.jobId === jobId || j.id === jobId);

          if (matchRes) {
            currentR = matchRes;
            currentJ = matchJob || null;
          } else if (matchJob) {
            currentJ = matchJob;
            const res = await dockingRepository.getResultByJobId(matchJob.jobId);
            currentR = res || null;
          }
        } else if (resList.length > 0) {
          currentR = resList[0];
          const matchJob = jobList.find((j) => j.jobId === resList[0].jobId);
          currentJ = matchJob || null;
        } else if (jobList.length > 0) {
          currentJ = jobList[0];
          const res = await dockingRepository.getResultByJobId(jobList[0].jobId);
          currentR = res || null;
        }

        setSelectedResult(currentR);
        setSelectedJob(currentJ);
        setSelectedPoseIndex(0);

        // Fetch protein structure if available
        if (currentR?.proteinId || currentJ?.proteinId) {
          const pId = currentR?.proteinId || currentJ?.proteinId;
          if (pId) {
            const p = await proteinRepository.getById(pId);
            setProteinRecord(p || null);
          }
        }

        // Fetch ligand structure if available
        if (currentR?.ligandId || currentJ?.ligandId) {
          const lId = currentR?.ligandId || currentJ?.ligandId;
          if (lId) {
            const l = await ligandRepository.getById(lId);
            setLigandRecord(l || null);
          }
        }
      } catch (err) {
        console.error('Failed to load docking results and jobs', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId]);

  const handleSelectJob = async (j: DockingJob) => {
    setSelectedJob(j);
    const r = results.find((item) => item.jobId === j.jobId);
    setSelectedResult(r || null);
    setSelectedPoseIndex(0);
    setHighlightedResidue(null);

    if (j.proteinId) {
      const p = await proteinRepository.getById(j.proteinId);
      setProteinRecord(p || null);
    }
    if (j.ligandId) {
      const l = await ligandRepository.getById(j.ligandId);
      setLigandRecord(l || null);
    }
    navigate(`/results/${j.jobId}`);
  };

  // Active pose extraction
  const poses = selectedResult?.poses || [];
  const currentPose = poses[selectedPoseIndex] || poses[0];

  // Real interaction analysis strictly from 3D coordinates (Requirement 5 & 6)
  const interactionResult = useMemo(() => {
    if (!selectedResult?.hasRealResult || !currentPose?.modelCoordinates) {
      return {
        hasAnalysis: false,
        interactions: [],
        hydrogenBondsCount: 0,
        hydrophobicContactsCount: 0,
        interactingResiduesCount: 0,
        statusNote: 'Interaction analysis is not available for this docking result.',
      };
    }

    return interactionAnalysisService.analyzeInteractions({
      proteinContent: proteinRecord?.fileData,
      ligandCoordinates: currentPose.modelCoordinates,
    });
  }, [selectedResult, currentPose, proteinRecord]);

  if (isLoading) {
    return <LoadingSpinner label="Loading docking result ledger..." className="h-80" />;
  }

  // Combined identifiers
  const currentJobId = selectedJob?.jobId || selectedResult?.jobId || jobId;
  const currentStatus = selectedJob?.status || selectedResult?.status || 'NO_RESULT';
  const proteinName = selectedResult?.proteinName || selectedJob?.proteinName || 'Target Protein';
  const ligandName = selectedResult?.ligandName || selectedJob?.ligandName || 'Candidate Ligand';
  const config = selectedResult?.configuration || selectedJob?.configuration;
  const bindingSite = config?.bindingSite || selectedResult?.bindingSiteConfig || selectedJob?.bindingSite;
  const isFailed = currentStatus === 'FAILED' || !!selectedJob?.error || !!selectedResult?.error;
  const hasRealScore = !!selectedResult?.hasRealResult && selectedResult?.dockingScore !== undefined;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Docking Results & Interaction Analysis"
        subtitle="3D binding poses, energetic scoring, and molecular contact analysis"
        badge={
          <Badge variant={hasRealScore ? 'success' : isFailed ? 'danger' : 'warning'} size="md">
            {hasRealScore ? 'Validated Vina Result' : isFailed ? 'Simulation Standby' : 'Demo Mode Foundation'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/comparison')}
              leftIcon={<BarChart3 className="w-4 h-4" />}
            >
              Candidate Comparison
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/docking')}
            >
              New Docking Run
            </Button>
          </div>
        }
      />

      {/* ================================================================ */}
      {/* SECTION 1: PROTEIN / LIGAND / DOCKING SUMMARY (Requirement 4)   */}
      {/* ================================================================ */}
      <div className="space-y-3">
        {/* Label: Computational Prediction */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 rounded-xl border border-indigo-500/30 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
          <div className="flex items-center gap-3 relative z-10">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-400/30 shadow-sm">
              Computational Prediction
            </span>
            <span className="text-xs text-slate-300">
              AutoDock Vina in silico scoring & interaction pipeline
            </span>
          </div>
          <div className="text-[11px] text-indigo-300/70 font-mono relative z-10 hidden md:block">
            Boundary: Frontend → Service Connector → Vina Engine → Parser
          </div>
        </div>

        {/* Mandatory Scientific Limitation Notice (Requirement 9 & Section 15) */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-100 block text-xs">
              Scientific Disclaimer
            </span>
            Docking results are computational predictions and do not establish clinical efficacy, therapeutic effectiveness, or experimental binding.
          </div>
        </div>

        {/* Engine Status Notice Banner */}
        {engineStatus?.isAvailable ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-sm block">
                  AutoDock Vina v{engineStatus.version || '1.2.7'} — Engine Available
                </span>
                <span className="text-[11px] text-emerald-300/80">
                  Host executable verified via server environment probe.
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-emerald-500/40">
              Host Process Connected
            </span>
          </div>
        ) : (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white text-sm">
                  Real docking engine unavailable. Configure AutoDock Vina to run computational docking.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 underline flex items-center gap-1"
              >
                {showSetupGuide ? 'Hide Setup Requirements' : 'View Setup Requirements'}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The environment probe confirmed that AutoDock Vina (<code>vina</code> / <code>vina.exe</code>) is not currently installed in the system PATH. Synthetic or fake docking scores and poses are <strong>never</strong> substituted.
            </p>

            {/* Setup Requirements Collapsible */}
            {showSetupGuide && engineStatus?.setupRequirements && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 bg-slate-950/60 p-3.5 rounded-lg font-mono text-[11px]">
                <div className="text-brand-300 font-bold uppercase text-[10px] tracking-wider">
                  AutoDock Vina Setup Requirements:
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  {engineStatus.setupRequirements.map((req, idx) => (
                    <li key={idx} className="leading-relaxed">{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        {selectedResult && (
          <Card className="shadow-card border-cyan-500/30/80">
            <CardHeader className="py-3 px-4 bg-navy-950/60/80 border-b border-cyan-500/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Run ID: {currentJobId}
                  </span>
                  <Badge
                    variant={
                      currentStatus === 'COMPLETED'
                        ? 'success'
                        : currentStatus === 'FAILED'
                        ? 'danger'
                        : currentStatus === 'RUNNING'
                        ? 'primary'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {currentStatus}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {selectedResult.engineUsed || config?.engine || 'AutoDock Vina'}
                  </Badge>
                </div>

                <div className="text-xs text-cyan-400/80 font-mono">
                  {selectedJob?.createdAt ? formatShortDate(selectedJob.createdAt) : ''}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-cyan-500/30 bg-navy-950/60/60">
                  <Dna className="w-5 h-5 text-brand-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Receptor</span>
                    <span className="font-bold text-cyan-50 truncate block">{proteinName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-cyan-500/30 bg-navy-950/60/60">
                  <Pill className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Ligand</span>
                    <span className="font-bold text-cyan-50 truncate block">{ligandName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-cyan-500/30 bg-navy-950/60/60">
                  <Crosshair className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Search Region</span>
                    <span className="font-bold text-cyan-50 truncate block">{bindingSite?.name || 'Active Site'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {results.length === 0 && jobs.length === 0 ? (
        <EmptyState
          icon={Crosshair}
          title="No Computational Docking Result Available"
          description="Select a target protein and candidate molecule in the Docking Workspace to initialize a simulation record."
          actionLabel="Launch Docking Workspace"
          onAction={() => navigate('/docking')}
        />
      ) : (
        <div className="space-y-6">
          {/* ================================================================ */}
          {/* SECTION 2: 3D MOLECULAR VIEWER (Requirement 1 & 4)              */}
          {/* ================================================================ */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                3D Molecular Viewport
              </h3>
              <span className="text-[11px] text-slate-400">
                Interactive WebGL Structure & Binding Mode View
              </span>
            </div>

            <MolecularViewer
              proteinName={proteinName}
              structureId={proteinRecord?.structureId}
              proteinData={proteinRecord?.fileData}
              proteinFormat={proteinRecord?.fileFormat}
              ligandName={ligandName}
              ligandData={currentPose?.modelCoordinates || ligandRecord?.fileData}
              selectedPoseMode={currentPose?.mode}
              bindingSite={bindingSite}
              hasCompletedDocking={selectedResult?.hasRealResult ?? false}
              isEngineUnavailable={!engineStatus?.isAvailable}
              interactionAnalysis={interactionResult}
              highlightedResidue={highlightedResidue}
              showGridBox={true}
            />
          </div>

          {/* ================================================================ */}
          {/* SECTION 3: POSE SELECTION (Requirement 3 & 4)                   */}
          {/* ================================================================ */}
          <Card className="shadow-card border-cyan-500/30/80 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="bg-navy-950/60/80 border-b border-cyan-500/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle>Pose Selection & Conformation Modes</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Select predicted binding pose to render in 3D viewport and analyze contacts
                    </p>
                  </div>
                </div>
                <Badge variant={poses.length > 0 ? 'primary' : 'neutral'} size="sm">
                  {poses.length} Modes Generated
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {poses.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                    {poses.map((p, idx) => {
                      const isSelected = idx === selectedPoseIndex;
                      return (
                        <button
                          key={p.mode}
                          type="button"
                          onClick={() => {
                            setSelectedPoseIndex(idx);
                            setHighlightedResidue(null);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-700 shadow-md ring-2 ring-brand-500/20'
                              : 'bg-navy-950/60 text-cyan-100 border-cyan-500/30 hover:bg-navy-800/60 hover:border-cyan-400/40'
                          }`}
                        >
                          <div className="font-bold text-xs">Pose {p.mode}</div>
                          <div className={`font-mono text-[11px] mt-0.5 ${isSelected ? 'text-brand-100' : 'text-emerald-700 font-semibold'}`}>
                            {p.affinity.toFixed(1)} <span className="text-[9px]">kcal</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Metadata for Selected Pose */}
                  {currentPose && (
                    <div className="p-3.5 bg-navy-950/60 rounded-lg border border-cyan-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
                          Selected Conformation
                        </span>
                        <span className="font-bold text-cyan-50">
                          Pose #{currentPose.mode} {currentPose.mode === 1 && '(Top Rank)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
                          Calculated Affinity (ΔG)
                        </span>
                        <span className="font-bold text-emerald-700">
                          {currentPose.affinity.toFixed(2)} kcal/mol
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
                          RMSD Lower Bound
                        </span>
                        <span className="text-cyan-200">
                          {currentPose.rmsdLowerBound.toFixed(3)} Å
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">
                          RMSD Upper Bound
                        </span>
                        <span className="text-cyan-200">
                          {currentPose.rmsdUpperBound.toFixed(3)} Å
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-navy-950/60 rounded-lg border border-cyan-500/30 text-center text-xs text-cyan-400/80">
                  No pose conformations available — docking engine was not run.
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* SECTION 4: INTERACTION ANALYSIS (Requirement 5 & 8)             */}
          {/* ================================================================ */}
          <InteractionAnalysisPanel
            analysis={interactionResult}
            dockingScore={selectedResult?.dockingScore}
            selectedPoseMode={currentPose?.mode}
            selectedPoseAffinity={currentPose?.affinity}
            onHighlightResidue={(resName, resSeq) => setHighlightedResidue({ resName, resSeq })}
          />

          {/* ================================================================ */}
          {/* SECTION 5: DETAILED DOCKING INFORMATION (Stage 4 Data Preserved) */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {/* Docking Configuration Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-card border-cyan-500/30/80">
                <CardHeader>
                  <CardTitle>Docking Configuration & Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Search volume grid */}
                  <div className="bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between font-bold text-cyan-100">
                      <span>Search Volume Coordinates (Å)</span>
                      <span className="text-[11px] font-mono text-cyan-400/80">
                        Spacing: {bindingSite?.spacing || 0.375} Å
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                      <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30">
                        <span className="text-[10px] text-slate-400 block font-sans">Center X, Y, Z</span>
                        ({bindingSite?.centerX ?? -10.5}, {bindingSite?.centerY ?? 12.3}, {bindingSite?.centerZ ?? 68.8})
                      </div>
                      <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30">
                        <span className="text-[10px] text-slate-400 block font-sans">Size X × Y × Z</span>
                        {bindingSite?.sizeX ?? 22} × {bindingSite?.sizeY ?? 22} × {bindingSite?.sizeZ ?? 22} Å
                      </div>
                      <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block font-sans">Exhaustiveness / Modes</span>
                        {config?.exhaustiveness || 8} / {config?.numModes || 9}
                      </div>
                    </div>
                  </div>

                  {/* Generated Output Files */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400/80" />
                      Generated Output Files
                    </h4>

                    {((selectedResult?.outputFiles && selectedResult.outputFiles.length > 0) ||
                      (selectedJob?.outputFiles && selectedJob.outputFiles.length > 0)) ? (
                      <div className="divide-y divide-slate-100 rounded-lg border border-cyan-500/30 bg-navy-900/40 backdrop-blur-md">
                        {(selectedResult?.outputFiles || selectedJob?.outputFiles || []).map((file, idx) => (
                          <div key={idx} className="p-2.5 px-3 flex items-center justify-between font-mono">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-cyan-100 font-semibold">{file.name}</span>
                              {file.size && (
                                <span className="text-[10px] text-slate-400">({file.size} bytes)</span>
                              )}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-navy-800/60 text-cyan-300 font-sans">
                              Prepared Structure / Log
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30 text-slate-400 italic">
                        No output files recorded.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Simulation Runs Ledger */}
              <Card className="shadow-card border-cyan-500/30/80">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Docking Simulation Jobs Ledger</CardTitle>
                    <span className="text-xs text-slate-400 font-medium">
                      {jobs.length} registered runs
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 text-xs">
                    {jobs.map((j) => {
                      const isSelected = (selectedJob?.jobId === j.jobId) || (selectedResult?.jobId === j.jobId);
                      return (
                        <div
                          key={j.jobId || j.id}
                          onClick={() => handleSelectJob(j)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-50/70 font-semibold' : 'hover:bg-navy-950/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-navy-800/60 flex items-center justify-center text-cyan-400/80 font-mono text-[10px]">
                              {j.status.substring(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-cyan-50 font-medium truncate">
                                {j.proteinName} + {j.ligandName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {formatShortDate(j.createdAt)} • {j.configuration?.bindingSite?.name || 'Active Site'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                j.status === 'COMPLETED'
                                  ? 'success'
                                  : j.status === 'FAILED'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {j.status}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Downstream Actions Sidebar (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-navy-900/40 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-card space-y-3 text-xs">
                <div className="font-bold text-cyan-50">Downstream Workflow Actions</div>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => navigate('/comparison')}
                    leftIcon={<BarChart3 className="w-3.5 h-3.5 text-brand-600" />}
                  >
                    Compare Against Other Candidates
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      const targetId = selectedJob?.jobId || selectedResult?.jobId;
                      navigate(targetId ? `/reports/${targetId}` : '/reports');
                    }}
                    leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    Generate Scientific Report for This Result
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => navigate('/prototype')}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Inspect Physical Prototype Mapping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
