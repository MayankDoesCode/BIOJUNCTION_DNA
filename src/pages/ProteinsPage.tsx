import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dna,
  UploadCloud,
  Plus,
  Trash2,
  ExternalLink,
  FileCode,
  Play,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { proteinRepository } from '../database/repositories/proteinRepository';
import { formatShortDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import type { Protein } from '../types';

export const ProteinsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [proteins, setProteins] = useState<Protein[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new protein upload
  const [formData, setFormData] = useState({
    name: '',
    structureId: '',
    description: '',
    source: 'RCSB PDB Reference',
    organism: '',
    resolution: '',
    fileName: '',
    fileFormat: 'PDBQT' as 'PDB' | 'PDBQT' | 'CIF',
    fileContent: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadProteins = async () => {
    try {
      setIsLoading(true);
      const data = await proteinRepository.getAll();
      setProteins(data);
    } catch (err) {
      console.error('Failed to load proteins', err);
      showToast('Error loading target proteins from local database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProteins();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toUpperCase() as 'PDB' | 'PDBQT' | 'CIF';
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileFormat: ['PDB', 'PDBQT', 'CIF'].includes(extension) ? extension : 'PDBQT',
        fileContent: content,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
    };

    reader.readAsText(file);
  };

  const handleCreateProtein = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Protein name is required';
    if (!formData.source.trim()) errors.source = 'Structure source is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newProtein: Protein = {
        id: `prot_${Date.now()}`,
        name: formData.name.trim(),
        structureId: formData.structureId.trim().toUpperCase() || undefined,
        description: formData.description.trim() || undefined,
        source: formData.source.trim(),
        organism: formData.organism.trim() || undefined,
        resolution: formData.resolution.trim() || undefined,
        fileName: formData.fileName || `${(formData.structureId || 'target').toLowerCase()}_prepared.pdbqt`,
        fileFormat: formData.fileFormat,
        fileData: formData.fileContent || undefined,
        fileSize: formData.fileContent ? formData.fileContent.length : 124000,
        uploadDate: new Date().toISOString(),
        status: 'READY',
      };

      await proteinRepository.create(newProtein);
      showToast(`Protein "${newProtein.name}" registered successfully`, 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        structureId: '',
        description: '',
        source: 'RCSB PDB Reference',
        organism: '',
        resolution: '',
        fileName: '',
        fileFormat: 'PDBQT',
        fileContent: '',
      });
      await loadProteins();
    } catch (err) {
      console.error('Failed to create protein', err);
      showToast('Error registering target protein', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProtein = async (id: string, name: string) => {
    if (confirm(`Remove protein structure "${name}"?`)) {
      try {
        await proteinRepository.delete(id);
        showToast(`Protein "${name}" removed`, 'info');
        await loadProteins();
      } catch (err) {
        console.error('Failed to delete protein', err);
        showToast('Error removing protein', 'error');
      }
    }
  };

  const filteredProteins = proteins.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.structureId || '').toLowerCase().includes(q) ||
      p.source.toLowerCase().includes(q) ||
      (p.organism || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading target protein structures..." className="h-80" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Target Proteins (Receptors)"
        subtitle="Manage 3D macromolecular structures for in silico binding site definition and docking simulations"
        badge={
          <Badge variant="primary" size="md">
            {proteins.length} {proteins.length === 1 ? 'Target' : 'Targets'}
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Protein Structure
          </Button>
        }
      />

      {/* Database Integration Notice */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/30 text-brand-400 flex items-center justify-center shrink-0">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">
              Macromolecular Structure Registry
            </span>
            <span className="text-slate-400">
              Structures stored locally in IndexedDB. Prepared for future 1-click RCSB PDB API retrieval and automated protonation/PDBQT conversion.
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/docking')}
          className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 shrink-0 text-xs"
        >
          Open Docking Workspace
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-navy-900/40 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/30 shadow-subtle flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search targets by name, PDB ID (e.g. 6LU7, 1HSG), source, or organism..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md transition-all"
          />
        </div>
      </div>

      {/* Protein Structures Table */}
      {filteredProteins.length === 0 ? (
        <EmptyState
          icon={Dna}
          title="No Protein Structures Found"
          description="Upload a PDB/PDBQT structure file or add reference metadata to begin docking simulations."
          actionLabel="Add Target Protein"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-navy-950/60/80 text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider">
                  <th className="py-3 px-4">Protein Name</th>
                  <th className="py-3 px-4">Structure ID</th>
                  <th className="py-3 px-4">Source / Reference</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProteins.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-950/60/80 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4 font-semibold text-cyan-50 max-w-xs">
                      <div className="truncate" title={p.name}>
                        {p.name}
                      </div>
                      {p.organism && (
                        <div className="text-[11px] text-slate-400 italic truncate mt-0.5">
                          {p.organism}
                        </div>
                      )}
                    </td>

                    {/* Structure ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {p.structureId || 'LOCAL-TARGET'}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-cyan-300 max-w-xs truncate">
                      {p.source}
                    </td>

                    {/* File Name */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.fileName || 'structure.pdbqt'}</span>
                      </div>
                    </td>

                    {/* Upload Date */}
                    <td className="py-3.5 px-4 text-cyan-400/80 whitespace-nowrap">
                      {formatShortDate(p.uploadDate)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant="success" size="sm">
                        {p.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate('/docking')}
                          leftIcon={<Play className="w-3 h-3 text-brand-600" />}
                          className="px-2.5 py-1 text-xs"
                          title="Use in Docking Workspace"
                        >
                          Dock
                        </Button>
                        <button
                          onClick={() => handleDeleteProtein(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-navy-800/60 transition-colors"
                          title="Remove Protein"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ADD PROTEIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-navy-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-cyan-50">Add Target Protein Structure</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-cyan-300 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProtein} className="space-y-4">
              {/* File Upload Selector */}
              <div className="p-4 rounded-xl border-2 border-dashed border-cyan-500/30 bg-navy-950/60 text-center hover:bg-navy-800/60/60 transition-colors relative">
                <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                <div className="text-xs font-semibold text-cyan-200">
                  {formData.fileName ? (
                    <span className="text-emerald-700 font-mono">Selected: {formData.fileName}</span>
                  ) : (
                    <span>Choose PDB, PDBQT, or CIF structure file</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Drag and drop or browse local storage for macromolecular coordinates
                </p>
                <input
                  type="file"
                  accept=".pdb,.pdbqt,.cif,.ent"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Protein Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Protein Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SARS-CoV-2 Main Protease (Mpro)"
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.name && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              {/* Structure ID & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Structure ID (PDB ID)
                  </label>
                  <input
                    type="text"
                    value={formData.structureId}
                    onChange={(e) => setFormData({ ...formData, structureId: e.target.value.toUpperCase() })}
                    placeholder="e.g. 6LU7, 1HSG, 7BV2"
                    maxLength={4}
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm font-mono text-cyan-50 uppercase focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Standard 4-character RCSB PDB code
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Structure / Source Information *
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g. RCSB PDB Reference, AlphaFold DB"
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Target Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Target Description & Biological Function
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize target role, active site characteristics, or biological mechanism..."
                  className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Organism & Resolution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Source Organism / Taxon
                  </label>
                  <input
                    type="text"
                    value={formData.organism}
                    onChange={(e) => setFormData({ ...formData, organism: e.target.value })}
                    placeholder="e.g. Severe acute respiratory syndrome coronavirus 2"
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                    Experimental Resolution (Å)
                  </label>
                  <input
                    type="text"
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    placeholder="e.g. 2.16 Å"
                    className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
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
                  Save Target Protein
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
