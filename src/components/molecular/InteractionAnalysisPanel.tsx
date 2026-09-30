import React, { useState } from 'react';
import {
  Link2,
  Sparkles,
  Flame,
  Dna,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import type { InteractionAnalysisResult } from '../../types';

interface InteractionAnalysisPanelProps {
  analysis?: InteractionAnalysisResult | null;
  dockingScore?: number;
  selectedPoseMode?: number;
  selectedPoseAffinity?: number;
  onHighlightResidue?: (residue: string, resSeq: number) => void;
  className?: string;
}

export const InteractionAnalysisPanel: React.FC<InteractionAnalysisPanelProps> = ({
  analysis,
  dockingScore,
  selectedPoseMode,
  selectedPoseAffinity,
  onHighlightResidue,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'HBOND' | 'HYDROPHOBIC' | 'RESIDUES'>('ALL');

  const hasAnalysis = !!analysis?.hasAnalysis;
  const interactions = analysis?.interactions || [];

  const hBonds = interactions.filter((i) => i.type === 'HYDROGEN_BOND');
  const hydrophobicContacts = interactions.filter((i) => i.type === 'HYDROPHOBIC');

  // Unique interacting residues
  const uniqueResidues = Array.from(
    new Map(
      interactions.map((i) => [`${i.chain || 'A'}:${i.proteinResidue}${i.residueNumber}`, i])
    ).values()
  );

  const displayedInteractions =
    activeTab === 'HBOND'
      ? hBonds
      : activeTab === 'HYDROPHOBIC'
      ? hydrophobicContacts
      : interactions;

  return (
    <Card className={`overflow-hidden border border-cyan-500/30 bg-navy-900/40 backdrop-blur-md ${className}`}>
      <CardHeader className="bg-navy-950/60/80 border-b border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-600" />
            <div>
              <CardTitle>Interaction Analysis</CardTitle>
              <p className="text-xs text-cyan-400/80 mt-0.5">
                Target-ligand intermolecular contact evaluation (Hydrogen Bonds, Hydrophobic Contacts)
              </p>
            </div>
          </div>
          <Badge variant={hasAnalysis ? 'success' : 'warning'} size="sm">
            {hasAnalysis ? 'Analyzed' : 'Not Available'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* COMPACT SUMMARY STRIP (Requirement 8) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-navy-950/60 p-3.5 rounded-xl border border-cyan-500/30 text-xs">
          {/* Docking Score */}
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Docking Score
            </span>
            <span className="font-mono font-bold text-cyan-100 text-sm">
              {dockingScore !== undefined ? `${dockingScore.toFixed(2)} kcal/mol` : 'Not available'}
            </span>
          </div>

          {/* Selected Pose */}
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Selected Pose
            </span>
            <span className="font-mono font-bold text-cyan-100 text-sm">
              {selectedPoseMode !== undefined
                ? `Pose #${selectedPoseMode} ${
                    selectedPoseAffinity !== undefined ? `(${selectedPoseAffinity.toFixed(1)} kcal/mol)` : ''
                  }`
                : 'Not available'}
            </span>
          </div>

          {/* Number of Interactions */}
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Interactions
            </span>
            <span className="font-mono font-bold text-cyan-100 text-sm">
              {hasAnalysis ? `${interactions.length} contacts` : 'Not available'}
            </span>
          </div>

          {/* Hydrogen Bonds */}
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Hydrogen Bonds
            </span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {hasAnalysis ? `${hBonds.length} bonds` : 'Not available'}
            </span>
          </div>

          {/* Hydrophobic Contacts */}
          <div className="space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Hydrophobic Contacts
            </span>
            <span className="font-mono font-bold text-amber-700 text-sm">
              {hasAnalysis ? `${hydrophobicContacts.length} contacts` : 'Not available'}
            </span>
          </div>
        </div>

        {/* SCIENTIFIC INTEGRITY ENFORCEMENT & NOT AVAILABLE STATE */}
        {!hasAnalysis ? (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="font-bold text-sm text-amber-950">
                Interaction analysis is not available for this docking result.
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              In accordance with scientific integrity guidelines, contact matrices (hydrogen bonds, van der Waals stabilization, and pocket residues) are computed strictly from real 3D coordinates. No artificial residues, bonds, or distances are fabricated or inferred from docking scores alone.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-cyan-500/30 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-cyan-300 hover:bg-navy-800/60'
                }`}
              >
                All Interactions ({interactions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HBOND')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'HBOND'
                    ? 'bg-emerald-600 text-white'
                    : 'text-cyan-300 hover:bg-navy-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Hydrogen Bonds ({hBonds.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('HYDROPHOBIC')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'HYDROPHOBIC'
                    ? 'bg-amber-600 text-white'
                    : 'text-cyan-300 hover:bg-navy-800/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Hydrophobic ({hydrophobicContacts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RESIDUES')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'RESIDUES'
                    ? 'bg-indigo-600 text-white'
                    : 'text-cyan-300 hover:bg-navy-800/60'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                Pocket Residues ({uniqueResidues.length})
              </button>
            </div>

            {/* TAB CONTENT: CONTACTS TABLE */}
            {activeTab !== 'RESIDUES' ? (
              <div className="overflow-x-auto rounded-lg border border-cyan-500/30">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-navy-950/60 text-cyan-400/80 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Target Residue</th>
                      <th className="px-3 py-2 text-left">Chain</th>
                      <th className="px-3 py-2 text-left">Ligand Atom</th>
                      <th className="px-3 py-2 text-right">Distance (Å)</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-navy-900/40 backdrop-blur-md font-mono">
                    {displayedInteractions.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-navy-950/60/70 transition-colors">
                        <td className="px-3 py-2 font-sans font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              item.type === 'HYDROGEN_BOND'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.type === 'HYDROGEN_BOND' ? 'H-Bond' : 'Hydrophobic'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-cyan-50 font-bold">
                          {item.proteinResidue} {item.residueNumber}
                        </td>
                        <td className="px-3 py-2 text-cyan-400/80 font-sans">
                          {item.chain || 'A'}
                        </td>
                        <td className="px-3 py-2 text-cyan-200">
                          {item.ligandAtom || 'LIG'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-cyan-100">
                          {item.distance !== undefined ? `${item.distance.toFixed(2)} Å` : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center font-sans">
                          {onHighlightResidue && (
                            <button
                              type="button"
                              onClick={() => onHighlightResidue(item.proteinResidue, item.residueNumber)}
                              className="text-[11px] text-brand-600 hover:text-brand-800 underline font-medium"
                            >
                              Highlight
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TAB CONTENT: UNIQUE POCKET RESIDUES CHIPS */
              <div className="space-y-3">
                <p className="text-xs text-cyan-400/80">
                  Amino acid residues within 4.0 Å of candidate ligand poses:
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueResidues.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => onHighlightResidue?.(res.proteinResidue, res.residueNumber)}
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-navy-950/60 hover:bg-brand-50 hover:border-brand-300 cursor-pointer text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="font-bold text-cyan-100">
                        {res.proteinResidue} {res.residueNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        (Chain {res.chain || 'A'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
