import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  Dna,
  Crosshair,
  Sparkles,
  ArrowRight,
  BarChart3,
  FileText,
  ChevronDown,
  Lock,
  CheckCircle2,
  Atom,
} from 'lucide-react';
import { BioJunctionLogo } from '../components/common/BioJunctionLogo';
import { Hero3DScene } from '../components/landing/Hero3DScene';
import { InteractiveConcept3D } from '../components/landing/InteractiveConcept3D';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleEnterPlatform = () => {
    navigate('/login');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const capabilities = [
    'PROTEIN STRUCTURES',
    'LIGAND CANDIDATES',
    'DOCKING ANALYSIS',
    '3D VISUALIZATION',
    'INTERACTION ANALYSIS',
    'SCIENTIFIC REPORTING',
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Protein',
      desc: 'Target macromolecule repository selection and structural integrity verification.',
    },
    {
      step: '02',
      title: 'Ligand',
      desc: 'Candidate molecule library curation and conformational coordinate preparation.',
    },
    {
      step: '03',
      title: 'Binding Site',
      desc: 'Search grid box configuration and active-site catalytic envelope definition.',
    },
    {
      step: '04',
      title: 'Docking',
      desc: 'Computational energy minimization and scoring algorithm execution.',
    },
    {
      step: '05',
      title: 'Results',
      desc: 'Multimodal binding pose parsing and free energy affinity evaluation.',
    },
    {
      step: '06',
      title: 'Analysis',
      desc: 'Hydrogen bond vector mapping, residue contacts, and polar interaction detection.',
    },
    {
      step: '07',
      title: 'Comparison',
      desc: 'Cross-candidate binding affinity ranking and overlay alignment.',
    },
    {
      step: '08',
      title: 'Report',
      desc: 'Cryptographically timestamped documentation and PDF audit export.',
    },
  ];

  const featureCards = [
    {
      icon: Dna,
      title: 'Protein & Ligand Management',
      desc: 'Curate macromolecular structures and candidate small-molecule repositories with automated validation and structural property parsing.',
    },
    {
      icon: Crosshair,
      title: 'Computational Docking',
      desc: 'Configure flexible grid search spaces and exhaustiveness parameters to simulate candidate binding orientations and energetic scoring.',
    },
    {
      icon: Atom,
      title: '3D Visualization',
      desc: 'Inspect predicted spatial conformations and active-site ribbon structures through lightweight, hardware-accelerated interactive viewports.',
    },
    {
      icon: Sparkles,
      title: 'Interaction Analysis',
      desc: 'Identify critical intermolecular stabilization vectors including hydrogen bonding networks, hydrophobic contacts, and residue proximity.',
    },
    {
      icon: BarChart3,
      title: 'Candidate Comparison',
      desc: 'Benchmark series of candidate molecules against identical target active sites to assess relative affinities and structural fit.',
    },
    {
      icon: FileText,
      title: 'Scientific Reporting',
      desc: 'Generate comprehensive, publication-ready analysis reports with immutable audit logging and professional vector exports.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden relative">
      {/* Background Subtle Scientific Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient Lighting Gradients */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[650px] bg-blue-700/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* NAVBAR (Section 10)                                                       */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#030712]/85 backdrop-blur-xl border-b border-cyan-500/20 py-3 shadow-2xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => scrollToSection('hero')}
            className="cursor-pointer flex items-center gap-2"
          >
            <BioJunctionLogo size="sm" variant="dark" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-cyan-400 transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="hover:text-cyan-400 transition-colors"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="hover:text-cyan-400 transition-colors"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('integrity')}
              className="hover:text-cyan-400 transition-colors"
            >
              Integrity
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnterPlatform}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-colors"
            >
              LOGIN
            </button>
            <button
              onClick={handleEnterPlatform}
              className="text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all flex items-center gap-1.5"
            >
              <span>ENTER PLATFORM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION (Sections 3-9, 11)                                           */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 min-h-[90vh] flex items-center z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content (Section 9) */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
              {/* Small Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono font-bold tracking-wider text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>COMPUTATIONAL MOLECULAR DOCKING</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Explore Protein–Ligand Interactions Through Computational Docking.
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Analyze predicted docking poses, computational affinity, molecular interactions,
                candidate comparisons, and scientific reports through an integrated workflow.
              </p>

              {/* Hero Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handleEnterPlatform}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/35 transition-all flex items-center justify-center gap-2"
                >
                  <span>ENTER PLATFORM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>EXPLORE WORKFLOW</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Notice */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Secure Terminal Authorization Required for Laboratory Workspaces</span>
              </div>
            </div>

            {/* Right: 3D Molecular Motion Scene (Sections 3-8, 11) */}
            <div className="lg:col-span-6 h-[440px] sm:h-[500px] lg:h-[580px] w-full relative rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-slate-950/60 to-[#020617]/90 shadow-2xl">
              <Hero3DScene className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAPABILITY STRIP (Section 12)                                             */}
      {/* ========================================================================= */}
      <section className="py-6 border-y border-cyan-500/20 bg-slate-950/70 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {capabilities.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-2">
                <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-300/90">
                  {item}
                </span>
                <span className="w-4 h-0.5 bg-cyan-500/40 mt-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* WORKFLOW SECTION (Section 13)                                             */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
              End-to-End Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Structure to Computational Insight
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              An integrated eight-stage computational protocol connecting structural inputs to
              actionable molecular affinity rankings and evidentiary analysis.
            </p>
          </div>

          {/* 8-Step Interactive Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-cyan-400/80 group-hover:text-cyan-300">
                      {step.step}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-500/30 group-hover:bg-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                  <span>STAGE {step.step} PROTOCOL</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE 3D SECTION: VISUALIZE MOLECULAR CONCEPT (Section 14)          */}
      {/* ========================================================================= */}
      <section
        id="technology"
        className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-slate-950/80 to-transparent relative z-10 border-t border-cyan-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">
              Interactive 3D Exploration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Visualize the Molecular Concept
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Observe how candidate ligands navigate conformational orientations to form predicted
              non-covalent contacts within a target receptor envelope.
            </p>
          </div>

          {/* Interactive 3D Docking Canvas */}
          <div className="max-w-5xl mx-auto">
            <InteractiveConcept3D />
          </div>

          {/* Disclaimer callout */}
          <div className="mt-6 text-center max-w-2xl mx-auto text-xs text-slate-400 font-mono">
            * Purely illustrative computational visualization. Graphic models represent abstract
            spatial geometry and do not reflect experimental crystallographic data or clinical
            outcomes.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURES GRID (Section 15)                                                */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Computational Rigor
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              A comprehensive computational suite built with structured data pipelines, automated
              audit trails, and clear scientific interpretation boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-slate-900/50 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-slate-900/80 transition-all duration-300 group shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Active Workflow Capability</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SCIENTIFIC INTEGRITY (Section 16)                                         */}
      {/* ========================================================================= */}
      <section
        id="integrity"
        className="py-16 sm:py-20 border-y border-cyan-500/20 bg-slate-950/90 relative z-10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Computational Insight, Not Experimental Proof
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            The platform provides computational predictions of possible protein–ligand binding
            configurations. Docking scores and predicted interactions support computational
            comparison but do not establish experimental confirmation or clinical efficacy.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <span>• In Silico Estimation</span>
            <span>• Non-Clinical Disclaimer</span>
            <span>• Forensic Evidence Protocol</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CTA (Section 17)                                                    */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
            Authorized Personnel Access
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Explore Molecular Docking.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Enter the platform to configure computational docking analyses, inspect predicted
            results, compare candidates, and generate reports.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleEnterPlatform}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER PLATFORM</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleEnterPlatform}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>LOGIN WITH CREDENTIALS</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="py-12 border-t border-cyan-500/10 bg-slate-950 text-xs font-mono text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">BIOJUNCTION TERMINAL</span>
            <span>•</span>
            <span>COMPUTATIONAL DRUG-PROTEIN PLATFORM</span>
          </div>

          <div className="flex items-center gap-6">
            <span>OFFLINE CAPABLE</span>
            <span>RESTRICTED ACCESS</span>
            <span>v2.6.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
