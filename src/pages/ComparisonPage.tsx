import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dna,
  Play,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { proteinRepository } from '../database/repositories/proteinRepository';
import { ligandRepository } from '../database/repositories/ligandRepository';
import { dockingRepository } from '../database/repositories/dockingRepository';
import { comparisonService } from '../services/comparisonService';
import type { Protein, Ligand, DockingJob, DockingResult } from '../types';

export const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();

  const [proteins, setProteins] = useState<Protein[]>([]);
  const [ligands, setLigands] = useState<Ligand[]>([]);
  const [jobs, setJobs] = useState<DockingJob[]>([]);
  const [results, setResults] = useState<DockingResult[]>([]);
  const [selectedProtein, setSelectedProtein] = useState<Protein | null>(null);

  // Selected candidate IDs for comparison (Requirement 2)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Filtering options (Requirement 9)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [protList, ligList, jobList, resList] = await Promise.all([
          proteinRepository.getAll(),
          ligandRepository.getAll(),
          dockingRepository.getJobs(),
          dockingRepository.getResults(),
        ]);

        setProteins(protList);
        setLigands(ligList);
        setJobs(jobList);
        setResults(resList);

        if (protList.length > 0) {
          setSelectedProtein(protList[0]);
        }

        // Default to selecting all candidate molecules if >= 2 available
        if (ligList.length >= 2) {
          setSelectedCandidateIds(ligList.map((l) => l.id));
        } else if (ligList.length > 0) {
          setSelectedCandidateIds([ligList[0].id]);
        }
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Toggle candidate selection
  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCandidateIds(ligands.map((l) => l.id));
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds([]);
  };

  // Validation (Requirement 11)
  const validation = useMemo(() => {
    return comparisonService.validateComparison({
      targetProtein: selectedProtein,
      selectedCandidateIds,
    });
  }, [selectedProtein, selectedCandidateIds]);

  // Selected candidate entities
  const selectedLigands = useMemo(() => {
    return ligands.filter((l) => selectedCandidateIds.includes(l.id));
  }, [ligands, selectedCandidateIds]);

  // Build comparison rows
  const comparisonRows = useMemo(() => {
    if (!selectedProtein || selectedLigands.length === 0) return [];
    return comparisonService.buildComparisonRows({
      targetProtein: selectedProtein,
      selectedCandidates: selectedLigands,
      jobs,
      results,
    });
  }, [selectedProtein, selectedLigands, jobs, results]);

  // Filtered comparison rows (Requirement 9)
  const filteredRows = useMemo(() => {
    return comparisonRows.filter((row) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED' && row.dockingStatus !== 'COMPLETED') return false;
        if (statusFilter === 'STANDBY' && row.dockingStatus !== 'STANDBY') return false;
        if (statusFilter === 'PENDING' && !['PENDING', 'QUEUED', 'RUNNING'].includes(row.dockingStatus)) return false;
        if (statusFilter === 'FAILED' && row.dockingStatus !== 'FAILED') return false;
        if (statusFilter === 'AWAITING' && row.dockingStatus !== 'AWAITING_DOCKING') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = row.candidateName.toLowerCase().includes(query);
        const matchesChem = row.chemicalName?.toLowerCase().includes(query) ?? false;
        const matchesFormula = row.formula?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesChem && !matchesFormula) return false;
      }

      return true;
    });
  }, [comparisonRows, statusFilter, searchQuery]);

  // Summary compilation (Requirement 7)
  const summary = useMemo(() => {
    if (!selectedProtein) return null;
    return comparisonService.buildComparisonSummary({
      targetProtein: selectedProtein,
      rows: comparisonRows,
    });
  }, [selectedProtein, comparisonRows]);

  if (isLoading) {
    return <LoadingSpinner label="Compiling multi-candidate comparison matrix..." className="h-80" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Multiple-Candidate Docking Comparison"
        subtitle="Evaluate and compare candidate molecules against the same macromolecular target under controlled parameters"
        badge={
          <Badge variant="primary" size="md">
            {selectedCandidateIds.length} Candidates Selected
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/reports?type=comparison&proteinId=${selectedProtein?.id || ''}&candidates=${selectedCandidateIds.join(',')}`
                )
              }
              leftIcon={<FileText className="w-4 h-4 text-indigo-600" />}
            >
              Export Comparison Report
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/docking')}
              leftIcon={<Play className="w-4 h-4" />}
            >
              New Docking Run
            </Button>
          </div>
        }
      />

      {/* TARGET PROTEIN SELECTOR & CONTROLLED CONFIGURATION HEADER */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800 shadow-md">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
              Target Receptor Benchmark
            </span>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <Dna className="w-4 h-4 text-brand-400" />
              <span>Target: {selectedProtein?.name || 'Receptor Not Selected'}</span>
            </div>
            <p className="text-xs text-slate-300">
              PDB ID: <strong className="text-white">{selectedProtein?.structureId || 'LOCAL-TARGET'}</strong> • Organism:{' '}
              {selectedProtein?.organism || 'Biological Receptor'} • Engine: <strong>AutoDock Vina</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-slate-400 font-medium">Switch Target:</label>
            <select
              value={selectedProtein?.id || ''}
              onChange={(e) => {
                const target = proteins.find((p) => p.id === e.target.value);
                if (target) setSelectedProtein(target);
              }}
              className="px-3 py-1.5 bg-slate-800 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {proteins.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.structureId || 'Custom'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* CANDIDATE SELECTION PANEL (Requirement 2) */}
      <Card className="shadow-card border-cyan-500/30/80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="py-3 px-4 bg-navy-950/60/80 border-b border-cyan-500/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <CardTitle>Select Candidate Molecules for Comparison</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-brand-600 hover:text-brand-800 font-semibold underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-cyan-400/80 hover:text-cyan-200 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ligands.map((l) => {
              const isSelected = selectedCandidateIds.includes(l.id);
              return (
                <div
                  key={l.id}
                  onClick={() => handleToggleCandidate(l.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-navy-950/60 border-cyan-500/30 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-indigo-600">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-cyan-50 truncate">{l.name}</span>
                      {l.isDemo && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          DEMO
                        </span>
                      )}
                    </div>
                    {l.chemicalName && (
                      <p className="text-[11px] text-cyan-400/80 truncate mt-0.5">{l.chemicalName}</p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {l.formula || 'C-H-O-N'} • {l.molecularWeight ? `${l.molecularWeight} Da` : 'Small molecule'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* VALIDATION WARNING / ERROR MESSAGES (Requirement 11 & 12) */}
      {!validation.isValid && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm text-amber-950">
              Comparison Requirements Not Met
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-700 pt-1">
              Select at least two candidate molecules using the checkboxes above to activate the comparative matrix.
            </p>
          </div>
        </div>
      )}

      {/* CONFIGURATION COMPATIBILITY WARNING (Requirement 3) */}
      {summary?.hasConfigurationMismatch && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            Docking Configuration Mismatch Detected
          </div>
          <p className="text-rose-800 leading-relaxed">
            The selected candidate runs were calculated under differing grid volume coordinates, search dimensions, or exhaustiveness levels. Comparative ranking across differing search boxes is not scientifically calibrated.
          </p>
          <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
            {summary.configurationWarnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPARISON SUMMARY STRIP (Requirement 7)                        */}
      {/* ================================================================ */}
      {validation.isValid && summary && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Protein</span>
              <span className="font-bold text-cyan-50 truncate block">{summary.targetProteinName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidates</span>
              <span className="font-mono font-bold text-cyan-100 text-sm">{summary.totalCandidates}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Completed Dockings</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">{summary.completedDockings}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending / Standby</span>
              <span className="font-mono font-bold text-amber-700 text-sm">{summary.pendingDockings}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Failed Runs</span>
              <span className="font-mono font-bold text-rose-700 text-sm">{summary.failedDockings}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-cyan-400/80 px-1">
            <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Comparison is based on computational docking results under the selected common configuration.</span>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS (Requirement 9) */}
      {validation.isValid && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-900/40 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by candidate name or formula..."
              className="w-full bg-navy-950/60 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-cyan-400/80">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses ({comparisonRows.length})</option>
              <option value="COMPLETED">Completed Results</option>
              <option value="STANDBY">Standby / Demo</option>
              <option value="PENDING">Pending / Queued</option>
              <option value="FAILED">Failed</option>
              <option value="AWAITING">Awaiting Docking</option>
            </select>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPARISON TABLE (Requirement 4, 5, 6, 8)                       */}
      {/* ================================================================ */}
      {validation.isValid ? (
        filteredRows.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Candidates Match Filter Criteria"
            description="Adjust your search query or status filter to display candidate molecules in the comparative matrix."
            actionLabel="Reset Filters"
            onAction={() => {
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
          />
        ) : (
          <Card className="overflow-hidden shadow-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="bg-navy-950/60/80 border-b border-cyan-500/30">
              <div className="flex items-center justify-between">
                <CardTitle>Comparative Candidate Matrix</CardTitle>
                <span className="text-xs text-cyan-400/80 font-mono">
                  {filteredRows.length} candidates displayed
                </span>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyan-500/30 bg-navy-950/60 text-[11px] font-bold text-cyan-400/80 uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Docking Status</th>
                    <th className="py-3 px-4 text-right">Best Docking Score</th>
                    <th className="py-3 px-4">Best Pose</th>
                    <th className="py-3 px-4 text-right">Hydrogen Bonds</th>
                    <th className="py-3 px-4 text-right">Hydrophobic Contacts</th>
                    <th className="py-3 px-4 text-right">Interacting Residues</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRows.map((row) => {
                    const hasScore = row.dockingScore !== undefined;
                    return (
                      <tr key={row.candidateId} className="hover:bg-navy-950/60/80 transition-colors">
                        {/* Candidate Name */}
                        <td className="py-3.5 px-4 font-bold text-cyan-50 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{row.candidateName}</span>
                            {row.isDemo && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                DEMO
                              </span>
                            )}
                          </div>
                          {row.chemicalName && (
                            <p className="text-[11px] text-cyan-400/80 font-normal truncate mt-0.5">
                              {row.chemicalName}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {row.formula || 'C-H-O-N'}
                          </div>
                        </td>

                        {/* Docking Status */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              row.dockingStatus === 'COMPLETED'
                                ? 'success'
                                : row.dockingStatus === 'FAILED'
                                ? 'danger'
                                : row.dockingStatus === 'RUNNING' || row.dockingStatus === 'PENDING'
                                ? 'primary'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {row.dockingStatus === 'AWAITING_DOCKING'
                              ? 'Awaiting Docking'
                              : row.dockingStatus === 'STANDBY'
                              ? 'Engine Standby'
                              : row.dockingStatus}
                          </Badge>
                        </td>

                        {/* Best Docking Score (Requirement 4 & 8) */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {hasScore ? (
                            <span className="text-emerald-700">
                              {row.dockingScore?.toFixed(2)}{' '}
                              <span className="text-[10px] font-normal text-cyan-400/80">kcal/mol</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic font-sans">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Best Pose */}
                        <td className="py-3.5 px-4 font-mono text-cyan-200">
                          {row.bestPose || (
                            <span className="text-slate-400 font-normal italic font-sans">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Hydrogen Bonds */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          {row.hydrogenBondsCount !== undefined ? (
                            <span className="font-bold text-cyan-100">{row.hydrogenBondsCount}</span>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-[11px]">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Hydrophobic Contacts */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          {row.hydrophobicContactsCount !== undefined ? (
                            <span className="font-bold text-cyan-100">{row.hydrophobicContactsCount}</span>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-[11px]">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Interacting Residues */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          {row.interactingResiduesCount !== undefined ? (
                            <span className="font-bold text-cyan-100">{row.interactingResiduesCount}</span>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-[11px]">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* Actions: View Result (Requirement 5 & 6) */}
                        <td className="py-3.5 px-4 text-right">
                          {row.jobId ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/results/${row.jobId}`)}
                              leftIcon={<ExternalLink className="w-3 h-3 text-brand-600" />}
                              className="px-2.5 py-1 text-xs"
                            >
                              View Result
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate('/docking')}
                              leftIcon={<Play className="w-3 h-3" />}
                              className="px-2.5 py-1 text-xs"
                            >
                              Run Docking
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* EMPTY STATE: AT LEAST TWO CANDIDATES REQUIRED (Requirement 12) */
        <EmptyState
          icon={Layers}
          title="At least two candidates are required for comparison"
          description="Select multiple candidate molecules above to generate a side-by-side comparative matrix against the active target receptor."
          actionLabel="Select All Candidates"
          onAction={handleSelectAll}
        />
      )}

      {/* SCIENTIFIC LIMITATION NOTICE (Requirement 8 & 9) */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white block text-xs">
            Scientific Limitation Notice & Score Interpretation
          </span>
          Docking scores represent in silico binding free energy predictions and do not establish clinical effectiveness, safety, or ranking as a cure. Users should inspect the structural interactions and numerical metrics themselves without inferring therapeutic outcome.
        </div>
      </div>
    </div>
  );
};
