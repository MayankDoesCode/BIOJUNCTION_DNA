import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dna,
  Pill,
  Crosshair,
  FileCheck2,
  Play,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DockingWorkflowStepper } from '../components/molecular/DockingWorkflowStepper';
import { BindingSiteEditor } from '../components/molecular/BindingSiteEditor';
import { MolecularViewer } from '../components/molecular/MolecularViewer';
import { proteinRepository } from '../database/repositories/proteinRepository';
import { ligandRepository } from '../database/repositories/ligandRepository';
import { dockingService, type DockingEngineStatus } from '../services/dockingService';
import { useToast } from '../hooks/useToast';
import type { Protein, Ligand, BindingSite, DockingJobStatus } from '../types';

export const DockingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [engineStatus, setEngineStatus] = useState<DockingEngineStatus | null>(null);
  const [jobProgress, setJobProgress] = useState<{
    status: DockingJobStatus;
    progressPercent: number;
    message: string;
  } | null>(null);

  // Available Data
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [ligands, setLigands] = useState<Ligand[]>([]);

  // Selected State
  const [selectedProtein, setSelectedProtein] = useState<Protein | null>(null);
  const [selectedLigand, setSelectedLigand] = useState<Ligand | null>(null);
  const [bindingSite, setBindingSite] = useState<BindingSite>({
    name: 'SARS-CoV-2 Mpro Active Site (Cys145-His41)',
    description: 'Catalytic dyad Cys145 and His41 pocket centered on crystallographic reference coordinates',
    centerX: -10.5,
    centerY: 12.3,
    centerZ: 68.8,
    sizeX: 22.0,
    sizeY: 22.0,
    sizeZ: 22.0,
    spacing: 0.375,
  });
  const [bindingSiteErrors, setBindingSiteErrors] = useState<Record<string, string>>({});

  // Additional Docking Engine Parameters (for review)
  const [engineSettings] = useState({
    engine: 'AutoDock Vina',
    exhaustiveness: 8,
    numModes: 9,
    energyRange: 3.0,
  });

  const [simulationNote, setSimulationNote] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [protList, ligList, status] = await Promise.all([
          proteinRepository.getAll(),
          ligandRepository.getAll(),
          dockingService.checkEngineStatus(),
        ]);
        setProteins(protList);
        setLigands(ligList);
        setEngineStatus(status);

        if (protList.length > 0) setSelectedProtein(protList[0]);
        if (ligList.length > 0) setSelectedLigand(ligList[0]);
      } catch (err) {
        console.error('Failed to load docking dependencies', err);
        showToast('Error loading proteins or candidate ligands', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedProtein) {
        showToast('Please select a target protein to continue', 'warning');
        return;
      }
      setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedLigand) {
        showToast('Please select a candidate molecule to continue', 'warning');
        return;
      }
      setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const validation = dockingService.validateBindingSite(bindingSite);
      if (!validation.isValid) {
        setBindingSiteErrors(validation.errors);
        showToast('Please resolve binding region validation errors', 'warning');
        return;
      }
      setBindingSiteErrors({});
      setCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 4])));
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartDocking = async () => {
    if (!selectedProtein || !selectedLigand) return;

    setIsSubmitting(true);
    setJobProgress({
      status: 'PREPARING',
      progressPercent: 10,
      message: 'Preparing molecular inputs and validating search space...',
    });

    try {
      const { job } = await dockingService.submitDockingJob({
        protein: selectedProtein,
        ligand: selectedLigand,
        bindingSite,
        notes: simulationNote,
        onProgress: (status, progressPercent, message) => {
          setJobProgress({ status, progressPercent, message });
        },
      });

      showToast('Docking job created and registered successfully', 'success');
      setTimeout(() => {
        navigate(`/results/${job.jobId}`);
      }, 500);
    } catch (err: any) {
      console.error('Failed to submit docking job', err);
      setJobProgress({
        status: 'FAILED',
        progressPercent: 100,
        message: err.message || 'Job submission failed',
      });
      showToast(err.message || 'Error registering docking job', 'error');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Preparing molecular docking workspace..." className="h-80" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Docking Workspace"
        subtitle="Computational in silico evaluation of ligand poses and predicted binding orientations"
        badge={
          <Badge variant="warning" size="md">
            Demo Mode — Engine Standby
          </Badge>
        }
      />

      {/* Prominent Demo Notice Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950 block text-sm">
            Demo Mode — Docking Engine Integration Pending
          </span>
          This workspace configures the full AutoDock Vina search box and target–ligand pairing. In this prototype stage, simulation jobs are saved and tracked locally in IndexedDB without claiming unverified computational numbers. Real AutoDock Vina execution will occur via the backend connector.
        </div>
      </div>

      {/* Stepper Navigation */}
      <DockingWorkflowStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* STEP CONTENT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Step Interaction Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: SELECT TARGET PROTEIN */}
          {currentStep === 1 && (
            <Card className="animate-fade-in shadow-card hover:shadow-card-hover transition-all duration-300 border-cyan-500/30/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Dna className="w-5 h-5 text-brand-600" />
                  <div>
                    <CardTitle>Step 1 — Select Target Protein</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Choose the macromolecular receptor structure for the docking search
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proteins.map((p) => {
                    const isSelected = selectedProtein?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProtein(p)}
                        className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-50 border-brand-500 shadow-sm ring-4 ring-brand-500/10 scale-[1.01]'
                            : 'bg-navy-900/40 backdrop-blur-md border-cyan-500/30 hover:border-cyan-400/40 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-cyan-50 line-clamp-1">
                            {p.name}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                        </div>
                        <div className="text-xs font-mono font-bold text-brand-700 mt-1">
                          PDB: {p.structureId || 'LOCAL-TARGET'}
                        </div>
                        <p className="text-[11px] text-cyan-400/80 mt-1 line-clamp-2">
                          {p.description || p.source}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-cyan-500/30/60">
                          <span>{p.organism || 'Biological Target'}</span>
                          <span>{p.resolution || 'Prepared PDBQT'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-cyan-400/80">
                  <span>Need an alternate target?</span>
                  <button
                    type="button"
                    onClick={() => navigate('/proteins')}
                    className="text-brand-600 hover:text-brand-700 font-semibold underline flex items-center gap-1"
                  >
                    Manage Target Proteins
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: SELECT CANDIDATE MOLECULE */}
          {currentStep === 2 && (
            <Card className="animate-fade-in shadow-card hover:shadow-card-hover transition-all duration-300 border-cyan-500/30/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle>Step 2 — Select Candidate Molecule</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Choose candidate drug ligand to dock into {selectedProtein?.name}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ligands.map((l) => {
                    const isSelected = selectedLigand?.id === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLigand(l)}
                        className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-4 ring-indigo-500/10 scale-[1.01]'
                            : 'bg-navy-900/40 backdrop-blur-md border-cyan-500/30 hover:border-cyan-400/40 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-cyan-50">
                              {l.name}
                            </h4>
                            {l.isDemo && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                DEMO
                              </span>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </div>

                        {l.chemicalName && (
                          <div className="text-[11px] text-cyan-300 font-medium mt-0.5 truncate">
                            {l.chemicalName}
                          </div>
                        )}

                        <p className="text-[11px] text-cyan-400/80 mt-1 line-clamp-2">
                          {l.description || 'Candidate molecule prepared for binding assay.'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-cyan-500/30/60">
                          <span>{l.formula || 'C-H-O-N'}</span>
                          <span>{l.molecularWeight ? `${l.molecularWeight} Da` : 'Prepared PDBQT'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-cyan-400/80">
                  <span>Want to upload new candidate ligands?</span>
                  <button
                    type="button"
                    onClick={() => navigate('/ligands')}
                    className="text-brand-600 hover:text-brand-700 font-semibold underline flex items-center gap-1"
                  >
                    Manage Candidate Molecules
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: DEFINE BINDING/SEARCH REGION */}
          {currentStep === 3 && (
            <Card className="animate-fade-in shadow-card hover:shadow-card-hover transition-all duration-300 border-cyan-500/30/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-emerald-600" />
                  <div>
                    <CardTitle>Step 3 — Define Binding / Search Region</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Specify 3D grid box dimensions and center coordinates for target exploration
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BindingSiteEditor
                  value={bindingSite}
                  onChange={(newSite) => setBindingSite(newSite)}
                  errors={bindingSiteErrors}
                />
              </CardContent>
            </Card>
          )}

          {/* STEP 4: REVIEW CONFIGURATION */}
          {currentStep === 4 && (
            <Card className="animate-fade-in shadow-card hover:shadow-card-hover transition-all duration-300 border-cyan-500/30/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle>Step 4 — Review Docking Configuration</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Verify structural pairings, search box constraints, and algorithm parameters
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Protein Summary */}
                  <div className="bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Target Protein (Receptor)
                    </span>
                    <div className="text-sm font-bold text-cyan-50">{selectedProtein?.name}</div>
                    <div className="text-xs text-brand-700 font-mono mt-0.5">
                      ID: {selectedProtein?.structureId || 'N/A'} • {selectedProtein?.fileName}
                    </div>
                  </div>

                  {/* Candidate Ligand Summary */}
                  <div className="bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                      Candidate Molecule (Ligand)
                    </span>
                    <div className="text-sm font-bold text-cyan-50 flex items-center gap-1.5">
                      <span>{selectedLigand?.name}</span>
                      {selectedLigand?.isDemo && (
                        <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">
                          DEMO
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-400/80 font-mono mt-0.5">
                      Formula: {selectedLigand?.formula || 'N/A'} • {selectedLigand?.fileName}
                    </div>
                  </div>
                </div>

                {/* Binding Box Summary */}
                <div className="bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Search Volume Coordinates (Å)
                    </span>
                    <span className="text-xs font-semibold text-cyan-200">{bindingSite.name}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30">
                      Center: ({bindingSite.centerX}, {bindingSite.centerY}, {bindingSite.centerZ})
                    </div>
                    <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30">
                      Size: {bindingSite.sizeX} × {bindingSite.sizeY} × {bindingSite.sizeZ} Å
                    </div>
                    <div className="bg-navy-900/40 backdrop-blur-md p-2 rounded border border-cyan-500/30 col-span-2 sm:col-span-1">
                      Grid Spacing: 0.375 Å
                    </div>
                  </div>
                </div>

                {/* Engine Parameters */}
                <div className="bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30 space-y-1 text-xs text-cyan-300">
                  <div className="font-semibold text-cyan-100">Algorithm Specification</div>
                  <p>
                    Engine: <strong className="text-cyan-50">{engineSettings.engine}</strong> (Simulated Standby) • Exhaustiveness: {engineSettings.exhaustiveness} • Modes: {engineSettings.numModes} • Energy Range: {engineSettings.energyRange} kcal/mol
                  </p>
                </div>

                {/* Simulation Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Job / Experimentation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={simulationNote}
                    onChange={(e) => setSimulationNote(e.target.value)}
                    placeholder="Enter observation notes, physical prototype piece labels, or hypothesis..."
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: START DOCKING */}
          {currentStep === 5 && (
            <Card className="animate-fade-in shadow-card hover:shadow-card-hover transition-all duration-300 border-cyan-500/30/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-600" />
                  <div>
                    <CardTitle>Step 5 — Start Docking Simulation</CardTitle>
                    <p className="text-xs text-cyan-400/80 mt-0.5">
                      Enqueue in silico docking run and generate auditable tracking record
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-brand-400 font-bold uppercase">
                      Execution Standby
                    </span>
                    <Badge variant="warning" size="sm">
                      {engineStatus?.isAvailable ? 'Engine Connected' : 'AutoDock Vina Standby'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">
                    Ready to enqueue docking pair:
                  </h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>• Receptor: <strong className="text-white">{selectedProtein?.name}</strong></div>
                    <div>• Candidate: <strong className="text-white">{selectedLigand?.name}</strong></div>
                    <div>• Region: <strong className="text-white">{bindingSite.name}</strong></div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    Triggering submission prepares input structures, registers a docking job with status tracking, and navigates to the <strong>Results Page</strong>.
                  </p>
                </div>

                {/* Engine Availability Banner */}
                {(!engineStatus || !engineStatus.isAvailable) && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Real docking engine unavailable. Configure AutoDock Vina to run computational docking.
                    </div>
                    <p className="text-[11px] text-amber-800">
                      The host environment does not currently have AutoDock Vina (<code>vina.exe</code>) in its PATH. Docking will be registered in local standby mode without generating artificial binding scores.
                    </p>
                  </div>
                )}

                {/* Active Job Progress Feedback */}
                {jobProgress && (
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">Simulation Status</span>
                      <Badge
                        variant={
                          jobProgress.status === 'COMPLETED'
                            ? 'success'
                            : jobProgress.status === 'FAILED'
                            ? 'danger'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {jobProgress.status}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${jobProgress.progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {jobProgress.message}
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Scientific Integrity Statement:</strong> Results generated during this stage reflect structural configuration and UI workflow readiness. Numerical binding energy values (kcal/mol) and pose RMSDs are strictly parsed from live AutoDock Vina outputs.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isSubmitting}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous Step
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {currentStep + 1}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleStartDocking}
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<Play className="w-4 h-4" />}
              >
                {isSubmitting ? 'Processing Simulation...' : 'Start Docking'}
              </Button>
            )}
          </div>
        </div>

        {/* 3D Visualization Preview Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400/80 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Real-time 3D Structure Preview
            </h4>
            <span className="text-[10px] text-slate-400">Interactive</span>
          </div>

          <MolecularViewer
            proteinName={selectedProtein?.name}
            ligandName={selectedLigand?.name}
            bindingSiteName={bindingSite.name}
            showGridBox={currentStep >= 3}
          />

          <div className="p-3 bg-navy-950/60 rounded-xl border border-cyan-500/30 text-[11px] text-cyan-300 space-y-1.5">
            <div className="font-bold text-cyan-100 flex items-center gap-1">
              <Info className="w-3 h-3 text-brand-600" />
              Physical Model Correspondence
            </div>
            <p className="leading-relaxed">
              In the planned interactive physical model, the <strong>Target Protein</strong> corresponds to the large tactile base model, and <strong>{selectedLigand?.name || 'Selected Ligand'}</strong> corresponds to the interchangeable physical piece.
            </p>
            <button
              onClick={() => navigate('/prototype')}
              className="text-brand-600 hover:text-brand-800 font-semibold underline text-[11px] block mt-1"
            >
              View Physical Prototype Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
