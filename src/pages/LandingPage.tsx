import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Shield, 
  Dna, 
  Layers, 
  BarChart3, 
  Activity, 
  FileText, 
  ArrowRight,
  Database,
  FlaskConical,
  Crosshair,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null; // Avoid flashing the landing page before redirect
  }

  return (
    <div className="min-h-screen bg-navy-950 text-cyan-50 font-sans selection:bg-cyan-500 selection:text-white">
      {/* 3. NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-lg border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Digital Companion</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-cyan-200">
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#features" className="hover:text-white transition-colors">Platform</a>
              <a href="#integrity" className="hover:text-white transition-colors">Research Integrity</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-cyan-100 hover:text-white transition-colors"
              >
                Login
              </button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => navigate('/login')}
                className="hidden sm:flex shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Enter Platform
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 4. HERO SECTION */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="max-w-2xl animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <Sparkles className="w-3.5 h-3.5" />
                Computational Molecular Docking
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-md">
                Explore Protein–Ligand Interactions <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                  Through Computational Docking
                </span>
              </h1>
              
              <p className="text-lg text-cyan-100/80 leading-relaxed mb-8 max-w-xl">
                Analyze predicted binding poses, docking scores, molecular interactions, and candidate compounds through an integrated computational workflow.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto text-base font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Enter Platform
                </Button>
                <a 
                  href="#workflow"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg border border-cyan-500/30 bg-navy-900/40 backdrop-blur-md text-cyan-100 font-semibold text-center hover:bg-navy-800/60 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                >
                  Explore Workflow
                </a>
              </div>
            </div>

            {/* 5. HERO VISUAL */}
            <div className="relative lg:h-[500px] flex items-center justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full max-w-md aspect-square bg-navy-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.15)] flex items-center justify-center overflow-hidden">
                {/* Simulated 3D representation */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-4 rounded-full border border-cyan-500/20 animate-[spin_60s_linear_infinite]"></div>
                <div className="absolute inset-12 rounded-full border border-indigo-500/20 animate-[spin_40s_linear_infinite_reverse]"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <Dna className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse-glow" />
                  <div className="mt-4 px-3 py-1 rounded bg-navy-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">
                    Illustrative molecular visualization
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 6. HERO DATA STRIP */}
      <div className="border-y border-cyan-500/20 bg-navy-900/40 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 text-center divide-x divide-cyan-500/20">
            <div className="space-y-1">
              <Database className="w-5 h-5 text-cyan-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-cyan-50 tracking-wider">PROTEIN STRUCTURES</div>
              <div className="text-[10px] text-cyan-400/80">Manage target receptors</div>
            </div>
            <div className="space-y-1">
              <FlaskConical className="w-5 h-5 text-indigo-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-cyan-50 tracking-wider">LIGAND CANDIDATES</div>
              <div className="text-[10px] text-cyan-400/80">Evaluate small molecules</div>
            </div>
            <div className="space-y-1">
              <Activity className="w-5 h-5 text-emerald-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-cyan-50 tracking-wider">DOCKING ANALYSIS</div>
              <div className="text-[10px] text-cyan-400/80">Execute in silico predictions</div>
            </div>
            <div className="space-y-1">
              <Layers className="w-5 h-5 text-brand-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-bold text-cyan-50 tracking-wider">3D VISUALIZATION</div>
              <div className="text-[10px] text-cyan-400/80">Inspect binding modes</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. WORKFLOW SECTION */}
      <section id="workflow" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">From Structure to Docking Insight</h2>
            <p className="text-cyan-100/80">A streamlined computational pipeline to predict and evaluate protein–ligand binding modes under controlled configurations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-12 left-24 right-24 h-0.5 bg-gradient-to-r from-cyan-500/10 via-cyan-500/40 to-cyan-500/10 z-0"></div>

            {[
              { step: '01', title: 'Protein & Ligand', desc: 'Select or upload target protein structures and candidate molecules.' },
              { step: '02', title: 'Binding Site', desc: 'Define the docking search region and structural parameters.' },
              { step: '03', title: 'Docking', desc: 'Run the configured AutoDock Vina computational workflow.' },
              { step: '04', title: 'Analyze & Compare', desc: 'Inspect predicted poses, compare results, and generate scientific reports.' }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-navy-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-cyan-100/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PLATFORM FEATURES */}
      <section id="features" className="py-24 bg-navy-900/20 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Platform Features</h2>
            <p className="text-cyan-100/80 max-w-2xl">Core computational capabilities integrated into a cohesive, browser-based professional environment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Database className="w-6 h-6 text-cyan-400" />}
              title="Protein & Ligand Management"
              description="Manage and validate the molecular structure datasets used for computational docking pipelines."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-indigo-400" />}
              title="Real Docking Workflow"
              description="Execute computational docking predictions locally using the configured AutoDock Vina engine integration."
            />
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-emerald-400" />}
              title="3D Molecular Visualization"
              description="Inspect docked poses and binding conformations interactively using the WebGL molecular viewport."
            />
            <FeatureCard 
              icon={<Crosshair className="w-6 h-6 text-amber-400" />}
              title="Interaction Analysis"
              description="Review geometrically detected hydrogen bonds, hydrophobic contacts, and interacting target residues."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-brand-400" />}
              title="Candidate Comparison"
              description="Compare multiple candidate docking results directly under equivalent configured computational conditions."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-rose-400" />}
              title="Scientific Reporting"
              description="Generate structured, auditable PDF reports from completed docking ledgers and interaction analysis."
            />
          </div>
        </div>
      </section>

      {/* 9. SCIENTIFIC INTEGRITY SECTION */}
      <section id="integrity" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-indigo-950/20 to-navy-950 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Info className="w-8 h-8 text-cyan-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-4">Computational Results, Not Experimental Proof</h2>
          <div className="glass-panel p-6 rounded-2xl text-cyan-100/90 text-sm leading-relaxed inline-block text-left">
            The platform provides computational predictions of possible protein–ligand binding configurations based on physical models. Docking scores and predicted interactions support computational comparison and hypothesis generation, but they <strong>do not establish clinical efficacy, safety, or experimental confirmation</strong>. All in silico results require rigorous laboratory validation.
          </div>
        </div>
      </section>

      {/* 11. CALL TO ACTION */}
      <section className="py-24 border-t border-cyan-500/20 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-black text-white mb-4">Ready to explore a docking analysis?</h2>
          <p className="text-cyan-100/80 mb-8 text-lg">
            Enter the platform to upload structures, configure docking parameters, inspect results, compare candidates, and generate scientific reports.
          </p>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/login')}
            className="shadow-[0_0_30px_rgba(6,182,212,0.5)] font-bold text-base px-10"
          >
            Enter Platform
          </Button>
        </div>
      </section>

      {/* 14. FOOTER */}
      <footer className="bg-navy-950 border-t border-navy-800 py-12 text-sm text-cyan-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-cyan-600" />
              <span className="font-bold text-white tracking-tight">Digital Companion</span>
            </div>
            <p className="max-w-xs mb-4">
              Computational molecular docking and protein–ligand interaction analysis platform.
            </p>
            <p className="text-[10px] text-cyan-100/40 uppercase tracking-widest font-mono">
              Computational predictions require experimental validation.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Navigation</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Platform</a></li>
              <li><a href="#workflow" className="hover:text-cyan-400 transition-colors">Workflow</a></li>
              <li><a href="#integrity" className="hover:text-cyan-400 transition-colors">Research Integrity</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Access</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-cyan-400 transition-colors">
                  Login to Platform
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glass-panel p-6 rounded-2xl hover:bg-navy-800/60 transition-colors group border-cyan-500/20 hover:border-cyan-500/50">
    <div className="w-12 h-12 rounded-xl bg-navy-950 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-shadow">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-xs text-cyan-100/70 leading-relaxed">{description}</p>
  </div>
);
