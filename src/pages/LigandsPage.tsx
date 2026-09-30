import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  UploadCloud,
  Plus,
  Trash2,
  FileCode,
  Info,
  RotateCcw,
  Search,
  Play,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ligandRepository } from '../database/repositories/ligandRepository';
import { formatShortDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import type { Ligand } from '../types';

export const LigandsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ligands, setLigands] = useState<Ligand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new candidate molecule
  const [formData, setFormData] = useState({
    name: '',
    chemicalName: '',
    formula: '',
    smiles: '',
    molecularWeight: '',
    description: '',
    fileName: '',
    fileFormat: 'PDBQT' as 'PDBQT' | 'SDF' | 'MOL2' | 'PDB',
    fileContent: '',
    isDemo: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadLigands = async () => {
    try {
      setIsLoading(true);
      const data = await ligandRepository.getAll();
      setLigands(data);
    } catch (err) {
      console.error('Failed to load candidate molecules', err);
      showToast('Error loading candidate ligands from local database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLigands();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toUpperCase() as 'PDBQT' | 'SDF' | 'MOL2' | 'PDB';
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileFormat: ['PDBQT', 'SDF', 'MOL2', 'PDB'].includes(extension) ? extension : 'PDBQT',
        fileContent: content,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
    };

    reader.readAsText(file);
  };

  const handleCreateLigand = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Molecule / candidate name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const mw = parseFloat(formData.molecularWeight);
      const newLigand: Ligand = {
        id: `lig_${Date.now()}`,
        name: formData.name.trim(),
        chemicalName: formData.chemicalName.trim() || undefined,
        formula: formData.formula.trim() || undefined,
        smiles: formData.smiles.trim() || undefined,
        molecularWeight: isNaN(mw) ? undefined : mw,
        description: formData.description.trim() || undefined,
        fileName: formData.fileName || `${formData.name.toLowerCase().replace(/\s+/g, '_')}.pdbqt`,
        fileFormat: formData.fileFormat,
        fileData: formData.fileContent || undefined,
        fileSize: formData.fileContent ? formData.fileContent.length : 1850,
        isDemo: formData.isDemo,
        uploadDate: new Date().toISOString(),
        status: 'READY',
      };

      await ligandRepository.create(newLigand);
      showToast(`Candidate molecule "${newLigand.name}" registered`, 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        chemicalName: '',
        formula: '',
        smiles: '',
        molecularWeight: '',
        description: '',
        fileName: '',
        fileFormat: 'PDBQT',
        fileContent: '',
        isDemo: false,
      });
      await loadLigands();
    } catch (err) {
      console.error('Failed to create candidate ligand', err);
      showToast('Error registering candidate molecule', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLigand = async (id: string, name: string) => {
    if (confirm(`Remove candidate molecule "${name}"?`)) {
      try {
        await ligandRepository.delete(id);
        showToast(`Candidate "${name}" removed`, 'info');
        await loadLigands();
      } catch (err) {
        console.error('Failed to delete ligand', err);
        showToast('Error removing candidate', 'error');
      }
    }
  };

  const handleResetDemoCandidates = async () => {
    if (confirm('Reset candidates library to default demo molecules (Drug A, Drug B, Drug C)?')) {
      await ligandRepository.resetToDemo();
      showToast('Reset to demo candidate molecules', 'info');
      await loadLigands();
    }
  };

  const filteredLigands = ligands.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.chemicalName || '').toLowerCase().includes(q) ||
      (l.formula || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading candidate drug molecules..." className="h-80" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Candidate Drug Molecules (Ligands)"
        subtitle="Manage candidate small molecules for docking evaluation against selected target proteins"
        badge={
          <Badge variant="neutral" size="md">
            {ligands.length} {ligands.length === 1 ? 'Candidate' : 'Candidates'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetDemoCandidates}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-cyan-400/80" />}
              title="Restore standard demo molecules (Drug A, Drug B, Drug C)"
            >
              Reset Demo Set
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Candidate Molecule
            </Button>
          </div>
        }
      />

      {/* Advisory Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold block mb-0.5">
            Computational Prototype Candidate Registry
          </span>
          Demo candidate molecules (<strong>Drug A</strong>, <strong>Drug B</strong>, <strong>Drug C</strong>) are simulated structures designed to illustrate binding pocket complementary fit and tactile physical demonstration. The system does not fabricate scientific results or clinical outcomes.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-navy-900/40 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/30 shadow-subtle flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, chemical formula, or IUPAC/trivial descriptor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md transition-all"
          />
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {filteredLigands.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No Candidate Molecules Found"
          description="Upload a PDBQT/SDF/MOL2 ligand file or add demo candidate molecules to proceed with docking."
          actionLabel="Add Candidate Molecule"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLigands.map((l) => (
            <Card key={l.id} className="p-4 flex flex-col justify-between space-y-3 hover:border-cyan-400/40 transition-colors">
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-cyan-50 truncate">
                        {l.name}
                      </h4>
                      {l.isDemo && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          DEMO
                        </span>
                      )}
                    </div>
                    {l.chemicalName && (
                      <p className="text-[11px] text-cyan-400/80 truncate mt-0.5">
                        {l.chemicalName}
                      </p>
                    )}
                  </div>

                  <Badge variant="primary" size="sm">
                    {l.status}
                  </Badge>
                </div>

                {/* Description */}
                {l.description && (
                  <p className="text-xs text-cyan-300 line-clamp-2 leading-relaxed bg-navy-950/60 p-2 rounded-lg border border-slate-100">
                    {l.description}
                  </p>
                )}

                {/* Molecule Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-navy-950/60/70 p-2 rounded border border-slate-100 font-mono text-cyan-200">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Formula</span>
                    <span className="font-semibold">{l.formula || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Mol. Weight</span>
                    <span>{l.molecularWeight ? `${l.molecularWeight} g/mol` : 'Unspecified'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono truncate">{l.fileName || 'molecule.pdbqt'}</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  {formatShortDate(l.uploadDate)}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/docking')}
                    leftIcon={<Play className="w-3 h-3 text-brand-600" />}
                    className="px-2.5 py-1 text-xs"
                    title="Select this candidate in Docking Workspace"
                  >
                    Select
                  </Button>
                  <button
                    onClick={() => handleDeleteLigand(l.id, l.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-navy-800/60 transition-colors"
                    title="Remove Molecule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD LIGAND MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-navy-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-cyan-50">Add Candidate Molecule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-cyan-300 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLigand} className="space-y-4">
              {/* File Upload Selector */}
              <div className="p-4 rounded-xl border-2 border-dashed border-cyan-500/30 bg-navy-950/60 text-center hover:bg-navy-800/60/60 transition-colors relative">
                <UploadCloud className="w-7 h-7 text-brand-500 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-cyan-200">
                  {formData.fileName ? (
                    <span className="text-emerald-700 font-mono">Selected: {formData.fileName}</span>
                  ) : (
                    <span>Choose PDBQT, SDF, or MOL2 molecule file</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Coordinate geometry for in silico search and 3D preview
                </p>
                <input
                  type="file"
                  accept=".pdbqt,.sdf,.mol2,.pdb"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Molecule Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Candidate / Compound Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Drug D (Experimental Analog)"
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.name && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              {/* Chemical Name / Formula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Chemical / IUPAC Name
                  </label>
                  <input
                    type="text"
                    value={formData.chemicalName}
                    onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                    placeholder="e.g. 2-(4-isobutylphenyl)propanoic acid"
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Chemical Formula
                  </label>
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                    placeholder="e.g. C22H28N4O5"
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Molecular Weight */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Molecular Weight (g/mol)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.molecularWeight}
                  onChange={(e) => setFormData({ ...formData, molecularWeight: e.target.value })}
                  placeholder="e.g. 488.5"
                  className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Candidate Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Candidate Notes / Structural Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Hypothesis on binding affinity, pharmacophore features, or tactile piece designation..."
                  className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Register Candidate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
