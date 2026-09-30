import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Dna,
  Pill,
  Laptop,
  ArrowRightLeft,
  ArrowRight,
  Magnet,
  Box,
  Eye,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const PrototypePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Interactive Physical Model Prototype"
        subtitle="Tangible 3D physical model paired with real-time software simulation to explain molecular docking concepts visually"
        badge={
          <Badge variant="primary" size="md">
            Educational & Explanatory Architecture
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/docking')}
            leftIcon={<Dna className="w-4 h-4" />}
          >
            Open Docking Software
          </Button>
        }
      />

      {/* Concept Overview Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Physical–Digital Complementary Demonstration
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Connecting Computational Docking to a Tactile Physical Demonstration
        </h2>

        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Computational molecular docking operates on 3D coordinate grids and mathematical energy scoring functions. The interactive physical model brings these abstract algorithms into physical reality through a large-scale tactile protein scaffold, interchangeable candidate drug pieces, and magnetic feedback.
        </p>

        {/* Relationship Diagram Card */}
        <div className="bg-slate-950/80 rounded-xl p-4 sm:p-6 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Physical Model ⟷ Software Application Mapping
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            {/* Physical Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Box className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-100">Physical Protein Model</h5>
              <p className="text-xs text-slate-400">
                Large 3D printed or modeled target receptor with carved binding pocket cavity.
              </p>
            </div>

            {/* Middle Correspondence Indicator */}
            <div className="flex flex-col items-center justify-center py-2 text-brand-400">
              <ArrowRightLeft className="w-8 h-8 animate-pulse hidden md:block" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider mt-1">
                Visual Correspondence
              </span>
            </div>

            {/* Software Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Dna className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-100">Target Protein in Software</h5>
              <p className="text-xs text-slate-400">
                Macromolecular coordinate structure file (PDB/PDBQT) rendered in 3D viewer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center pt-2 border-t border-slate-800">
            {/* Physical Ligands */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Pill className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-100">Physical Drug A / B / C</h5>
              <p className="text-xs text-slate-400">
                Interchangeable physical pieces representing candidate small molecules.
              </p>
            </div>

            {/* Middle Correspondence Indicator */}
            <div className="flex flex-col items-center justify-center py-2 text-brand-400">
              <ArrowRightLeft className="w-8 h-8 animate-pulse hidden md:block" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider mt-1">
                Visual Correspondence
              </span>
            </div>

            {/* Software Candidates */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Laptop className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-100">Candidate Molecules in Software</h5>
              <p className="text-xs text-slate-400">
                Digital small-molecule coordinates evaluated by the docking engine.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Demonstration Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Large Protein Model */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">1. Large Protein Model</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            A macroscopic representation of the biological receptor (e.g., SARS-CoV-2 Main Protease). Features a clearly recessed binding pocket that mimics the active site cavity (Cys145–His41 catalytic site).
          </p>
          <div className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
            Serves as the tactile &quot;Lock&quot; in the molecular Lock-and-Key analogy.
          </div>
        </Card>

        {/* Card 2: Interchangeable Drug Pieces */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">2. Drug A, B, and C Pieces</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            Separate physical blocks engineered with different contours:
          </p>
          <ul className="text-xs text-cyan-300 space-y-1 list-disc list-inside">
            <li><strong>Drug A (Lead):</strong> Optimal geometric and electrostatic fit.</li>
            <li><strong>Drug B (Variant):</strong> Partial fit with moderate steric resistance.</li>
            <li><strong>Drug C (Control):</strong> Bulky non-fit that cannot enter cavity.</li>
          </ul>
        </Card>

        {/* Card 3: Magnetic & LED Feedback */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Magnet className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">3. Optional Magnet & LED Clues</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            Embedded small neodymium magnets demonstrate non-covalent attractive forces (hydrogen bonds, electrostatic attraction). Optional low-voltage LED illuminates upon correct key seating to indicate strong affinity.
          </p>
          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Reinforces how favorable binding energies drive molecular association.
          </div>
        </Card>

        {/* Card 4: Laptop / Tablet Software Link */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Laptop className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">4. Companion Software Display</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            A laptop or tablet placed adjacent to the physical model displays this software. As a participant tests Drug A in their hands, the digital screen shows the predicted 3D pose, docking score, and interaction residues.
          </p>
          <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            Bridges tactile intuition with rigorous computational modeling.
          </div>
        </Card>

        {/* Card 5: Educational Demonstration Flow */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">5. Interactive Presentation Flow</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            Participants are invited to physically insert each candidate into the protein model, observe whether it seats properly, and then inspect the simulated docking score ($\Delta G$) on the software dashboard.
          </p>
        </Card>

        {/* Card 6: Scientific Boundary Disclaimer */}
        <Card className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-navy-800/60 text-cyan-200 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-cyan-50">6. Scientific Scope Note</h4>
          <p className="text-xs text-cyan-300 leading-relaxed">
            The physical model is an explanatory pedagogical device. In living biological systems, macromolecules are conformationally dynamic and solvated by water molecules rather than rigid static plastic.
          </p>
        </Card>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/40 backdrop-blur-md border border-cyan-500/30 shadow-subtle text-xs">
        <div className="text-cyan-300">
          Ready to review the molecular comparison matrix or launch a digital docking simulation?
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/comparison')}
          >
            View Candidate Matrix
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/docking')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Docking Workspace
          </Button>
        </div>
      </div>
    </div>
  );
};
