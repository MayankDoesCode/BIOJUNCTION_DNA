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
import { DnaSequencingBackground } from '../components/common/DnaSequencingBackground';
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
    <div className="min-h-screen bg-luxury-cream text-luxury-maroon font-sans selection:bg-luxury-crimson selection:text-luxury-cream overflow-x-hidden relative">
      {/* Live DNA Sequencing Background */}
      <DnaSequencingBackground intensity="subtle" />

      {/* Warm Ambient Glow Overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#f1f0cc]/70 via-[#f8f7ee]/60 to-[#f1f0cc]/80 backdrop-blur-[1px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(213,191,134,0.18),transparent_65%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(167,29,49,0.08),transparent_55%)] pointer-events-none z-0" />

      {/* Subtle Scientific Coordinate Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(213, 191, 134, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(213, 191, 134, 0.22) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ========================================================================= */}
      {/* NAVBAR                                                                    */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-[#d5bf86]/40 py-3 shadow-md'
            : 'bg-[#fbfaf3]/80 backdrop-blur-md border-b border-[#d5bf86]/30 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => scrollToSection('hero')}
            className="cursor-pointer flex items-center gap-2"
          >
            <BioJunctionLogo size="sm" variant="light" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-luxury-maroon/80">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-luxury-crimson transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="hover:text-luxury-crimson transition-colors"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="hover:text-luxury-crimson transition-colors"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-luxury-crimson transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('integrity')}
              className="hover:text-luxury-crimson transition-colors"
            >
              Integrity
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleEnterPlatform}
              className="text-xs sm:text-sm font-bold text-luxury-maroon hover:text-luxury-crimson px-3 sm:px-4 py-2 rounded-xl transition-colors hover:bg-luxury-gold/15"
            >
              LOGIN
            </button>
            <button
              onClick={handleEnterPlatform}
              className="text-xs sm:text-sm font-bold bg-luxury-crimson hover:bg-luxury-maroon text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md border border-luxury-gold/40 hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>ENTER PLATFORM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 min-h-[90vh] flex items-center z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs font-mono font-bold tracking-wider text-luxury-crimson shadow-xs">
                <span className="w-2 h-2 rounded-full bg-luxury-crimson animate-pulse" />
                <span>COMPUTATIONAL MOLECULAR DOCKING</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-luxury-maroon leading-[1.15]">
                Explore Protein–Ligand Interactions <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-crimson via-brand-600 to-luxury-maroon">
                  Through Computational Docking.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base lg:text-lg text-luxury-maroon/80 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Analyze predicted docking poses, computational affinity, molecular interactions,
                candidate comparisons, and scientific reports through an integrated workflow.
              </p>

              {/* Hero Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handleEnterPlatform}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-luxury-crimson hover:bg-luxury-maroon text-white font-extrabold text-sm shadow-lg shadow-luxury-crimson/20 border border-luxury-gold/50 transition-all flex items-center justify-center gap-2"
                >
                  <span>ENTER PLATFORM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('workflow')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/90 hover:bg-white border border-[#d5bf86]/70 text-luxury-maroon font-bold text-sm shadow-xs hover:border-luxury-crimson/50 transition-all flex items-center justify-center gap-2"
                >
                  <span>EXPLORE WORKFLOW</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Security Notice */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-luxury-taupe font-mono font-semibold">
                <Lock className="w-3.5 h-3.5 text-luxury-crimson" />
                <span>Secure Terminal Authorization Required for Laboratory Workspaces</span>
              </div>
            </div>

            {/* Right: 3D Molecular Motion Scene */}
            <div className="lg:col-span-6 h-[440px] sm:h-[500px] lg:h-[580px] w-full relative rounded-3xl overflow-hidden border border-[#d5bf86]/60 bg-gradient-to-b from-white/95 via-[#fbfaf3]/90 to-[#f1f0cc]/80 shadow-2xl backdrop-blur-sm">
              <Hero3DScene className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAPABILITY STRIP                                                          */}
      {/* ========================================================================= */}
      <section className="py-6 border-y border-[#d5bf86]/40 bg-white/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {capabilities.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-2">
                <span className="text-[11px] font-mono font-bold tracking-widest text-luxury-maroon">
                  {item}
                </span>
                <span className="w-4 h-0.5 bg-luxury-gold mt-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* WORKFLOW SECTION                                                          */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold text-luxury-crimson tracking-widest uppercase">
              End-to-End Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-luxury-maroon tracking-tight">
              From Structure to Computational Insight
            </h2>
            <p className="text-luxury-maroon/80 text-sm sm:text-base font-medium">
              An integrated eight-stage computational protocol connecting structural inputs to
              actionable molecular affinity rankings and evidentiary analysis.
            </p>
          </div>

          {/* 8-Step Interactive Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/90 border border-[#d5bf86]/50 hover:border-luxury-crimson/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-luxury-gold group-hover:text-luxury-crimson transition-colors">
                      {step.step}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-luxury-gold/50 group-hover:bg-luxury-crimson transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-luxury-maroon mb-2 group-hover:text-luxury-crimson transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-luxury-taupe leading-relaxed font-medium">{step.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#d5bf86]/30 text-[10px] font-mono text-luxury-taupe group-hover:text-luxury-crimson transition-colors flex items-center justify-between font-bold">
                  <span>STAGE {step.step} PROTOCOL</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE 3D SECTION: VISUALIZE MOLECULAR CONCEPT                       */}
      {/* ========================================================================= */}
      <section
        id="technology"
        className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-white/50 to-transparent relative z-10 border-t border-[#d5bf86]/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-mono font-bold text-luxury-crimson tracking-widest uppercase">
              Interactive 3D Exploration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-luxury-maroon tracking-tight">
              Visualize the Molecular Concept
            </h2>
            <p className="text-luxury-maroon/80 text-sm sm:text-base font-medium">
              Observe how candidate ligands navigate conformational orientations to form predicted
              non-covalent contacts within a target receptor envelope.
            </p>
          </div>

          {/* Interactive 3D Docking Canvas */}
          <div className="max-w-5xl mx-auto">
            <InteractiveConcept3D />
          </div>

          {/* Disclaimer callout */}
          <div className="mt-6 text-center max-w-2xl mx-auto text-xs text-luxury-taupe font-mono">
            * Purely illustrative computational visualization. Graphic models represent abstract
            spatial geometry and do not reflect experimental crystallographic data or clinical
            outcomes.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURES GRID                                                             */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 sm:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold text-luxury-crimson tracking-widest uppercase">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-luxury-maroon tracking-tight">
              Engineered for Computational Rigor
            </h2>
            <p className="text-luxury-maroon/80 text-sm sm:text-base font-medium">
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
                  className="p-8 rounded-3xl bg-white/90 border border-[#d5bf86]/50 hover:border-luxury-crimson/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-luxury-crimson/10 border border-luxury-crimson/20 flex items-center justify-center text-luxury-crimson mb-6 group-hover:scale-110 group-hover:bg-luxury-crimson group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-luxury-maroon mb-3 group-hover:text-luxury-crimson transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-luxury-taupe leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#d5bf86]/30 flex items-center gap-1.5 text-xs font-mono font-semibold text-luxury-crimson">
                    <CheckCircle2 className="w-3.5 h-3.5 text-luxury-crimson" />
                    <span>Active Workflow Capability</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SCIENTIFIC INTEGRITY                                                      */}
      {/* ========================================================================= */}
      <section
        id="integrity"
        className="py-16 sm:py-20 border-y border-[#d5bf86]/40 bg-white/80 backdrop-blur-md relative z-10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-luxury-crimson/10 border border-luxury-crimson/30 mx-auto flex items-center justify-center text-luxury-crimson">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-luxury-maroon tracking-tight">
            Computational Insight, Not Experimental Proof
          </h2>

          <p className="text-sm sm:text-base text-luxury-maroon/85 leading-relaxed max-w-2xl mx-auto font-medium">
            The platform provides computational predictions of possible protein–ligand binding
            configurations. Docking scores and predicted interactions support computational
            comparison but do not establish experimental confirmation or clinical efficacy.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-mono text-luxury-taupe font-semibold">
            <span>• In Silico Estimation</span>
            <span>• Non-Clinical Disclaimer</span>
            <span>• Forensic Evidence Protocol</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CTA                                                                 */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <span className="text-xs font-mono font-bold text-luxury-crimson tracking-widest uppercase">
            Authorized Personnel Access
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-luxury-maroon tracking-tight">
            Explore Molecular Docking.
          </h2>

          <p className="text-base sm:text-lg text-luxury-maroon/80 max-w-2xl mx-auto leading-relaxed font-medium">
            Enter the platform to configure computational docking analyses, inspect predicted
            results, compare candidates, and generate reports.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleEnterPlatform}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-luxury-crimson hover:bg-luxury-maroon text-white font-extrabold text-sm sm:text-base shadow-xl shadow-luxury-crimson/20 border border-luxury-gold/50 transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER PLATFORM</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleEnterPlatform}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-[#fbfaf3] border border-[#d5bf86] text-luxury-maroon font-bold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-luxury-crimson" />
              <span>LOGIN WITH CREDENTIALS</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="py-12 border-t border-[#d5bf86]/40 bg-white/90 text-xs font-mono text-luxury-taupe relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-luxury-maroon">BIOJUNCTION TERMINAL</span>
            <span>•</span>
            <span className="font-semibold">COMPUTATIONAL DRUG-PROTEIN PLATFORM</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <span>OFFLINE CAPABLE</span>
            <span>RESTRICTED ACCESS</span>
            <span>v2.6.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
