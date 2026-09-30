import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FlaskConical,
  Package,
  FileText,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
  Search,
  Bell,
  Settings,
  Home,
  LogOut,
  Maximize2,
  RotateCw,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { caseRepository } from '../database/repositories/caseRepository';
import { fieldTestRepository } from '../database/repositories/fieldTestRepository';
import { sampleRepository } from '../database/repositories/sampleRepository';
import { reportRepository } from '../database/repositories/reportRepository';
import { syncRepository } from '../database/repositories/syncRepository';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatShortDate, formatStatusLabel } from '../utils/formatters';
import type { Case, FieldTest, TestResultOutcome } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('P-543');
  const [isRotating, setIsRotating] = useState(false);
  const [isBottomHudHidden, setIsBottomHudHidden] = useState(false);

  const [stats, setStats] = useState({
    activeCases: 0,
    testsConducted: 0,
    pendingSamples: 0,
    reportsGenerated: 0,
    unsyncedRecords: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [recentTests, setRecentTests] = useState<FieldTest[]>([]);

  // Pipeline projects matching concept image
  const pipelineProjects = [
    {
      id: 'P-543',
      name: 'P-543 (Oncology Target)',
      target: 'DNA Gyrase • Ciprofloxacin',
      pdbId: '7KFT',
      status: 'Active',
      statusColor: 'emerald',
      score: '-9.4 kcal/mol',
      rmsd: '1.12 Å',
      hBonds: 4,
    },
    {
      id: 'P-320',
      name: 'P-320 (Anti-Viral)',
      target: 'SARS-CoV-2 RdRp • Remdesivir',
      pdbId: '6VXX',
      status: 'Awaiting Data',
      statusColor: 'amber',
      score: '-8.9 kcal/mol',
      rmsd: '1.45 Å',
      hBonds: 3,
    },
    {
      id: 'P-601',
      name: 'P-601 (Neurology)',
      target: 'B-DNA Dodecamer • Netropsin',
      pdbId: '1BNA',
      status: 'Completed',
      statusColor: 'emerald',
      score: '-10.8 kcal/mol',
      rmsd: '0.98 Å',
      hBonds: 6,
    },
  ];

  const activeProject =
    pipelineProjects.find((p) => p.id === selectedProjectId) || pipelineProjects[0];

  // Team activity feed matching concept image
  const teamActivities = [
    {
      id: 1,
      author: 'Dr. Iris Thorne',
      avatarColor: 'from-amber-600 to-rose-600',
      action: 'commented on P-543',
      comment: 'Docking score improved by 18% with relaxed active-site water shell.',
      time: '14m ago',
      badge: 'Score +18%',
      badgeVariant: 'success' as const,
    },
    {
      id: 2,
      author: 'Prof. Alana Chen',
      avatarColor: 'from-blue-600 to-indigo-700',
      action: 'approved P-601 report',
      comment: 'Binding conformation verified in high-resolution crystallographic lattice.',
      time: '1h ago',
      badge: 'Approved',
      badgeVariant: 'primary' as const,
    },
    {
      id: 3,
      author: 'Commander R. Reyes',
      avatarColor: 'from-emerald-600 to-teal-700',
      action: 'sealed chain-of-custody',
      comment: 'Evidentiary protocol verified for seizure Case #2026-TX-089.',
      time: '3h ago',
      badge: 'Audit Seal',
      badgeVariant: 'warning' as const,
    },
    {
      id: 4,
      author: 'Dr. Julian Vance',
      avatarColor: 'from-purple-600 to-indigo-800',
      action: 'imported PDB structures',
      comment: 'Expanded 20 target proteins and 20 candidate ligands into database cache.',
      time: '4h ago',
      badge: 'Dataset',
      badgeVariant: 'default' as const,
    },
    {
      id: 5,
      author: 'Specialist Nora Diaz',
      avatarColor: 'from-rose-600 to-red-800',
      action: 'spectrometry match',
      comment: 'RAMAN spectral baseline matched target fentanyl analogue with 98.4% confidence.',
      time: '6h ago',
      badge: 'Verified',
      badgeVariant: 'success' as const,
    },
    {
      id: 6,
      author: 'Lab Director Patel',
      avatarColor: 'from-amber-700 to-yellow-600',
      action: 'recalibrated simulation',
      comment: 'AutoDock Vina search grid aligned to active catalytic dyad His41-Cys145.',
      time: '8h ago',
      badge: 'Grid 0.375Å',
      badgeVariant: 'neutral' as const,
    },
  ];

  // Heatmap interaction hotspot residue matrix
  const hotspotResidues = ['Arg28', 'Asp42', 'Glu87', 'Trp112', 'Lys134'];
  const hotspotColumns = ['R-1', 'R-2', 'C=O', 'F-Sub', 'Pip-N', 'Ring-B'];
  // Normalized heat values 0-1 (higher = stronger interaction)
  const heatmapData = [
    [0.9, 0.4, 0.8, 0.2, 0.7, 0.3],
    [0.3, 0.8, 0.5, 0.9, 0.1, 0.6],
    [0.7, 0.2, 0.9, 0.4, 0.8, 0.5],
    [0.4, 0.7, 0.3, 0.8, 0.5, 0.9],
    [0.8, 0.5, 0.6, 0.3, 0.9, 0.4],
  ];

  const getHeatmapColor = (val: number) => {
    if (val >= 0.8) return 'bg-rose-500/80 border-rose-400 text-white';
    if (val >= 0.6) return 'bg-orange-500/80 border-orange-400 text-white';
    if (val >= 0.4) return 'bg-cyan-500/70 border-cyan-400 text-cyan-950';
    return 'bg-blue-900/60 border-blue-500/40 text-cyan-200';
  };

  const loadDashboardData = async () => {
    try {
      const [
        activeCases,
        testsConducted,
        pendingSamples,
        reportsGenerated,
        unsyncedRecords,
        cases,
        tests,
      ] = await Promise.all([
        caseRepository.countActive(),
        fieldTestRepository.countTotal(),
        sampleRepository.countPending(),
        reportRepository.countTotal(),
        syncRepository.countPending(),
        caseRepository.getRecent(4),
        fieldTestRepository.getRecent(4),
      ]);

      setStats({
        activeCases,
        testsConducted,
        pendingSamples,
        reportsGenerated,
        unsyncedRecords,
      });
      setRecentCases(cases);
      setRecentTests(tests);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      showToast('Error loading local field metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.triggerManualSync();
      if (result.success) {
        showToast(result.message, 'success', 'Sync Successful');
        await loadDashboardData();
      } else {
        showToast(result.message, 'warning', 'Sync Notice');
      }
    } catch {
      showToast('Encountered an issue executing local sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Session terminated. Terminal locked.', 'info');
      navigate('/login');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const getCaseStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return 'primary';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'CLOSED':
        return 'neutral';
      default:
        return 'default';
    }
  };

  const getTestOutcomeVariant = (outcome: TestResultOutcome): BadgeVariant => {
    switch (outcome) {
      case 'PRESUMPTIVE_POSITIVE':
        return 'warning';
      case 'PRESUMPTIVE_NEGATIVE':
        return 'success';
      case 'INCONCLUSIVE':
      case 'INVALID':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading local forensic field records..." className="h-96" />;
  }

  return (
    <div className="space-y-8 font-sans selection:bg-luxury-crimson selection:text-luxury-cream">
      {/* Quick Dataset Manager Banner */}
      <div className="bg-gradient-to-r from-[#1a0509] to-[#2e0910] text-[#f1f0cc] p-4 sm:p-5 rounded-2xl border border-[#d5bf86]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a71d31]/30 border border-[#a71d31]/50 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Large Scientific & Forensic Enterprise Dataset Available
              <span className="px-2 py-0.5 rounded-full bg-[#a71d31] text-[10px] font-bold text-white">150+ Records</span>
            </div>
            <div className="text-xs text-[#d5bf86]/80 mt-0.5">
              Instantly populate 20+ PDB target proteins, 20+ candidate molecules, forensic cases, or import custom CSV/JSON files.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/datasets')}
            className="bg-gradient-to-r from-[#a71d31] to-[#731322] hover:from-[#c2243b] text-white font-bold text-xs"
            leftIcon={<Database className="w-3.5 h-3.5" />}
          >
            Open Dataset Manager
          </Button>
        </div>
      </div>

      {/* 
        =============================================================================
        SECTION 1: BIO-SYNTHESIS ANALYTICS HUD - LUXURY THEME
        =============================================================================
      */}
      <div className="relative rounded-[28px] sm:rounded-[36px] bg-white/90 backdrop-blur-2xl border border-[#d5bf86]/50 shadow-xl overflow-hidden transition-all duration-300">
        
        {/* Subtle Ambient Glow Highlights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-luxury-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-luxury-crimson/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] pointer-events-none border border-white/60" />

        {/* Top HUD Frame Header */}
        <div className="px-6 py-4 border-b border-[#d5bf86]/30 flex items-center justify-between bg-gradient-to-r from-[#fbfaf3] via-white to-[#f8f7ee] text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold tracking-wider text-luxury-maroon">
              BIO-SYNTHESIS ANALYTICS TERMINAL
            </span>
            <span className="text-[#d5bf86] hidden sm:inline">|</span>
            <span className="text-[11px] font-mono text-luxury-taupe font-semibold hidden sm:inline">
              HUD v4.2 • SIMULATION ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-3 text-luxury-taupe">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-luxury-gold/20 border border-luxury-gold/50 font-mono text-[10px] text-luxury-maroon font-bold">
              <Activity className="w-3 h-3 text-luxury-crimson animate-pulse" />
              <span>RMSD: {activeProject.rmsd}</span>
              <span className="text-luxury-gold">•</span>
              <span>SCORE: {activeProject.score}</span>
            </div>

            <button
              onClick={() => showToast('HUD Diagnostics: Subsystems synchronized', 'info')}
              className="p-1.5 rounded-lg hover:bg-luxury-gold/20 hover:text-luxury-maroon transition-colors"
              title="Search Telemetry"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('2 unread system alerts in telemetry log', 'info')}
              className="p-1.5 rounded-lg hover:bg-luxury-gold/20 hover:text-luxury-maroon transition-colors relative"
              title="Alert Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-luxury-crimson animate-pulse" />
            </button>
          </div>
        </div>

        {/* 3-Column Holographic Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#d5bf86]/30">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: Project Pipeline (Left Panel) - LOCKED HEIGHT                   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-[#fbfaf3] to-[#f8f7ee] lg:h-[660px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-luxury-crimson" />
                  <h3 className="font-extrabold text-sm tracking-wide text-luxury-maroon">
                    Project Pipeline
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-luxury-gold/20 text-luxury-maroon border border-luxury-gold/40">
                  {pipelineProjects.length} ACTIVE
                </span>
              </div>

              {/* Project Card List with LOCKED HEIGHT & smooth scroll */}
              <div className="h-[480px] overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
                {pipelineProjects.map((proj) => {
                  const isSelected = proj.id === selectedProjectId;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        showToast(`Switched telemetry focus to ${proj.name}`, 'info');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden group shadow-2xs ${
                        isSelected
                          ? 'bg-white border-2 border-luxury-maroon shadow-md ring-1 ring-luxury-maroon/20'
                          : 'bg-white hover:bg-[#faf8f0] border-[#d5bf86]/40 hover:border-luxury-gold'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-luxury-crimson to-luxury-gold" />
                      )}

                      <div className="flex items-center justify-between mb-1.5 pl-1">
                        <span className="font-mono font-bold text-xs text-luxury-maroon group-hover:text-luxury-crimson transition-colors">
                          {proj.name}
                        </span>
                        {proj.status === 'Active' || proj.status === 'Completed' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                            <Clock className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-700 font-medium truncate mb-2 pl-1">
                        {proj.target}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#d5bf86]/20 text-[10px] font-mono pl-1">
                        <span className="text-luxury-taupe font-semibold">PDB: {proj.pdbId}</span>
                        <span className="text-emerald-700 font-bold">{proj.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action button */}
            <div className="mt-4 pt-3 border-t border-[#d5bf86]/30 space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/docking')}
                leftIcon={<Play className="w-3.5 h-3.5" />}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-luxury-crimson hover:bg-luxury-maroon text-white shadow-md transition-colors"
              >
                Launch In Silico Docking
              </Button>
              <button
                onClick={() => navigate('/comparison')}
                className="w-full text-center text-[11px] text-luxury-maroon hover:text-luxury-crimson font-bold font-mono py-1 transition-colors"
              >
                Compare Candidates &rarr;
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: Bio-Synthesis Analytics Hero & Analytics Charts (Center Panel)   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4 lg:h-[660px]">
            
            {/* Top Subheader */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-luxury-maroon flex items-center gap-2">
                  <span>Bio-Synthesis Analytics</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-luxury-gold/20 text-luxury-maroon border border-luxury-gold/50">
                    {activeProject.pdbId}
                  </span>
                </h2>
                <p className="text-xs text-luxury-taupe font-mono mt-0.5">
                  Target Interface: <span className="font-bold text-luxury-maroon">{activeProject.target}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`p-2 rounded-xl border border-[#d5bf86]/50 text-luxury-maroon hover:bg-luxury-gold/20 transition-colors shadow-2xs ${
                    isRotating ? 'bg-luxury-gold/30 text-luxury-crimson ring-1 ring-luxury-crimson/40' : 'bg-white'
                  }`}
                  title="Toggle 3D Rotation"
                >
                  <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/results')}
                  leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                  className="text-xs border-[#d5bf86] text-luxury-maroon hover:bg-luxury-gold/20 font-bold bg-white shadow-2xs"
                >
                  Full 3D Viewer
                </Button>
              </div>
            </div>

            {/* 3D Molecular Complex HUD Visualizer Canvas (Hero) */}
            <div className="relative h-64 sm:h-72 rounded-2xl bg-gradient-to-b from-[#fcfbf7] via-[#f5f3dc] to-[#ede9cb] border border-[#d5bf86]/50 overflow-hidden flex items-center justify-center group shadow-inner">
              
              {/* Background warm grid lines inside canvas */}
              <div 
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgba(213, 191, 134, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(213, 191, 134, 0.4) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Glowing Particle Flares */}
              <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-luxury-gold/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-luxury-crimson/20 rounded-full blur-2xl pointer-events-none" />

              {/* Central Holographic 3D Molecular Ribbon SVG */}
              <svg
                viewBox="0 0 500 280"
                className={`w-full h-full max-h-64 object-contain filter drop-shadow-[0_4px_12px_rgba(63,13,18,0.15)] ${
                  isRotating ? 'animate-pulse' : ''
                }`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="helix-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a71d31" />
                    <stop offset="50%" stopColor="#8e1829" />
                    <stop offset="100%" stopColor="#3f0d12" />
                  </linearGradient>
                  <linearGradient id="helix-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f1f0cc" />
                    <stop offset="50%" stopColor="#d5bf86" />
                    <stop offset="100%" stopColor="#8d775f" />
                  </linearGradient>
                  <linearGradient id="ligand-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d5bf86" />
                    <stop offset="100%" stopColor="#a71d31" />
                  </linearGradient>
                </defs>

                {/* Protein Secondary Ribbon Alpha-Helices (Left cluster) */}
                <path
                  d="M 90 90 Q 110 50 135 85 T 180 120 T 220 80 T 260 115"
                  stroke="#a855f7"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <path
                  d="M 120 160 Q 150 200 180 165 T 225 130 T 265 170"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* DNA Double-Helix Ribbon (Right cluster extending into binding pocket) */}
                <path
                  d="M 240 180 Q 280 120 320 160 T 380 100 T 440 140"
                  stroke="url(#helix-magenta)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 6px rgba(236,72,153,0.7))"
                />
                <path
                  d="M 250 140 Q 290 200 330 140 T 390 180 T 445 110"
                  stroke="url(#helix-cyan)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 6px rgba(6,182,212,0.7))"
                />

                {/* Base-pair rungs */}
                <line x1="285" y1="150" x2="295" y2="170" stroke="#fbcfe8" strokeWidth="2.5" />
                <line x1="325" y1="145" x2="325" y2="165" stroke="#a5f3fc" strokeWidth="2.5" />
                <line x1="355" y1="130" x2="365" y2="155" stroke="#fbcfe8" strokeWidth="2.5" />
                <line x1="410" y1="135" x2="415" y2="160" stroke="#a5f3fc" strokeWidth="2.5" />

                {/* Docked Drug Ligand Molecule in Binding Cavity (Center Highlight) */}
                <g transform="translate(230, 105)">
                  {/* Glowing Ligand Core Ring */}
                  <polygon
                    points="20,5 38,15 38,35 20,45 2,35 2,15"
                    fill="rgba(234, 179, 8, 0.25)"
                    stroke="url(#ligand-gold)"
                    strokeWidth="3.5"
                    filter="drop-shadow(0 0 8px rgba(250,204,21,0.8))"
                  />
                  {/* Fluorine & Carbonyl Branches */}
                  <line x1="20" y1="5" x2="20" y2="-10" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="20" cy="-10" r="4" fill="#ef4444" />
                  <line x1="38" y1="35" x2="52" y2="42" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="52" cy="42" r="4" fill="#3b82f6" />
                  <line x1="2" y1="35" x2="-12" y2="42" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="-12" cy="42" r="4" fill="#10b981" />

                  {/* Hydrogen Bonding Contact Vectors (Dashed cyan & yellow rays) */}
                  <line x1="20" y1="-10" x2="4" y2="-30" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="4" cy="-30" r="3" fill="#38bdf8" />
                  <line x1="52" y1="42" x2="75" y2="35" stroke="#f472b6" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="75" cy="35" r="3" fill="#f472b6" />
                </g>

                {/* Floating HUD Annotations inside viewer */}
                <g transform="translate(20, 25)">
                  <rect width="180" height="22" rx="4" fill="rgba(4, 14, 31, 0.75)" stroke="rgba(6, 182, 212, 0.4)" />
                  <text x="8" y="15" fill="#67e8f9" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    DRUG-PROTEIN-DNA BINDING INTERFACE
                  </text>
                </g>

                <g transform="translate(340, 240)">
                  <rect width="140" height="22" rx="4" fill="rgba(4, 14, 31, 0.75)" stroke="rgba(236, 72, 153, 0.4)" />
                  <text x="10" y="15" fill="#f472b6" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    ΔG = {activeProject.score}
                  </text>
                </g>
              </svg>

              {/* Bottom viewer controls bar */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-navy-950/80 backdrop-blur border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Grid Box: [22.4, 24.0, 20.8] Å • Exhaustiveness: 16
                </span>
                <span className="text-cyan-400/80">Vina Affinity Confirmed</span>
              </div>
            </div>

            {/* Lower Dual-Card Row: Binding Affinity Over Time & Interaction Hotspots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Binding Affinity Over Time */}
              <div className="p-4 rounded-2xl bg-white border border-[#d5bf86]/40 hover:border-luxury-gold shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-luxury-maroon">
                    Binding Affinity Over Time
                  </span>
                  <button
                    onClick={() => navigate('/comparison')}
                    className="text-[11px] font-mono text-luxury-crimson hover:text-luxury-maroon font-bold flex items-center gap-0.5"
                  >
                    <span>Analysis</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* SVG Affinity Convergence Curve Chart */}
                <div className="h-28 w-full relative">
                  <svg viewBox="0 0 200 100" className="w-full h-full" fill="none">
                    {/* Horizontal reference grid lines */}
                    <line x1="0" y1="25" x2="200" y2="25" stroke="rgba(213, 191, 134, 0.25)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(213, 191, 134, 0.25)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1="75" x2="200" y2="75" stroke="rgba(213, 191, 134, 0.25)" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Gradient Fill under Crimson Curve */}
                    <defs>
                      <linearGradient id="area-crimson" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a71d31" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#a71d31" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 75 Q 40 68 70 52 T 130 35 T 190 28 L 190 95 L 10 95 Z"
                      fill="url(#area-crimson)"
                    />

                    {/* Crimson Target Curve (P-543) */}
                    <path
                      d="M 10 75 Q 40 68 70 52 T 130 35 T 190 28"
                      stroke="#a71d31"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="190" cy="28" r="3.5" fill="#a71d31" />

                    {/* Amber Baseline Curve (Reference) */}
                    <path
                      d="M 10 82 Q 50 78 90 68 T 150 58 T 190 52"
                      stroke="#d5bf86"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      strokeLinecap="round"
                    />
                    <circle cx="190" cy="52" r="3" fill="#d5bf86" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-luxury-taupe pt-1.5 border-t border-[#d5bf86]/20">
                  <span className="flex items-center gap-1 font-bold text-luxury-maroon">
                    <span className="w-2 h-0.5 bg-luxury-crimson" /> {activeProject.id} ({activeProject.score})
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <span className="w-2 h-0.5 bg-luxury-gold border border-dashed" /> Ref (-7.1)
                  </span>
                </div>
              </div>

              {/* Card 2: Interaction Hotspots Heatmap Matrix */}
              <div className="p-4 rounded-2xl bg-white border border-[#d5bf86]/40 hover:border-luxury-gold shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-luxury-maroon">
                    Interaction Hotspots
                  </span>
                  <button
                    onClick={() => navigate('/results')}
                    className="text-[11px] font-mono text-luxury-crimson hover:text-luxury-maroon font-bold flex items-center gap-0.5"
                  >
                    <span>Analysis</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* 2D Heatmap Grid */}
                <div className="space-y-1 my-1">
                  {heatmapData.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex items-center gap-1">
                      <span className="w-10 text-[9px] font-mono text-luxury-taupe font-bold truncate text-right pr-1">
                        {hotspotResidues[rowIdx]}
                      </span>
                      <div className="flex-1 grid grid-cols-6 gap-1">
                        {row.map((val, colIdx) => (
                          <div
                            key={colIdx}
                            className={`h-4 rounded border text-[8px] flex items-center justify-center font-mono font-bold transition-transform hover:scale-110 cursor-pointer ${getHeatmapColor(
                              val
                            )}`}
                            title={`${hotspotResidues[rowIdx]} × ${hotspotColumns[colIdx]}: ${val.toFixed(2)}`}
                          >
                            {val >= 0.7 ? '★' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-luxury-taupe pt-1.5 border-t border-[#d5bf86]/20 font-semibold">
                  <span className="text-blue-700">Weak</span>
                  <span className="text-amber-700">Mid</span>
                  <span className="text-rose-700">Strong</span>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: Team Activity Feed (Right Panel) - LOCKED HEIGHT & HIGH CONTRAST */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 p-5 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-[#fbfaf3] to-[#f8f7ee] lg:h-[660px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-luxury-crimson" />
                  <h3 className="font-extrabold text-sm tracking-wide text-luxury-maroon">
                    Team Activity Feed
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REALTIME
                </span>
              </div>

              {/* Feed items with LOCKED HEIGHT and smooth scroll */}
              <div className="h-[480px] overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
                {teamActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#d5bf86]/40 hover:border-luxury-gold shadow-2xs hover:shadow-xs transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${act.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0`}
                        >
                          {act.author.charAt(0)}
                        </div>
                        <span className="font-bold text-luxury-maroon text-[11px] group-hover:text-luxury-crimson transition-colors truncate">
                          {act.author}
                        </span>
                      </div>
                      <Badge variant={act.badgeVariant} size="sm">
                        {act.badge}
                      </Badge>
                    </div>

                    <div className="text-[10px] text-luxury-taupe font-semibold pl-8 mb-1.5">
                      {act.action}
                    </div>

                    <p className="text-[11px] text-slate-800 font-medium leading-relaxed pl-8 bg-[#faf8f0] p-2.5 rounded-xl border border-[#d5bf86]/20">
                      {act.comment}
                    </p>

                    <div className="text-[10px] font-mono font-semibold text-luxury-taupe text-right mt-1.5 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-luxury-gold" />
                      <span>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Audit Log Shortcut */}
            <div className="mt-4 pt-3 border-t border-[#d5bf86]/30">
              <button
                type="button"
                onClick={() => navigate('/audit-log')}
                className="w-full py-2.5 px-3 rounded-xl bg-luxury-maroon text-white hover:bg-luxury-crimson font-bold text-xs font-mono text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>View Full Audit Log</span>
                <ExternalLink className="w-3.5 h-3.5 text-luxury-gold" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom HUD Station Bar matching luxury scheme: Home, Settings, User Dr. Vance, Logout */}
        {!isBottomHudHidden ? (
          <div className="px-6 py-3.5 border-t border-[#d5bf86]/30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#fbfaf3] via-white to-[#f8f7ee] text-xs transition-all">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 rounded-lg text-luxury-maroon hover:text-luxury-crimson hover:bg-luxury-gold/20 transition-colors"
                title="Return to Public Portal"
              >
                <Home className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 rounded-lg text-luxury-maroon hover:text-luxury-crimson hover:bg-luxury-gold/20 transition-colors"
                title="System Configuration"
              >
                <Settings className="w-4 h-4" />
              </button>
              <span className="text-luxury-gold/50">|</span>
              <span className="text-[11px] font-mono text-luxury-taupe font-semibold">
                Station Terminal: TER-4091A • Offline Cache Ready
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#d5bf86]/40 shadow-xs">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-luxury-gold">
                  <img
                    src="/images/dr-vance-avatar.jpg"
                    alt="Dr. E. Vance"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-semibold text-luxury-maroon">
                  User: <span className="text-luxury-crimson font-bold">{user?.fullName || 'Dr. E. Vance'}</span>
                </span>
                <span className="text-[10px] font-mono text-luxury-taupe">
                  ({user?.role || 'SUPERVISOR'})
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBottomHudHidden(true)}
                className="p-1.5 rounded-lg text-luxury-taupe hover:text-luxury-maroon hover:bg-luxury-gold/20 transition-colors ml-1"
                title="Hide Station Taskbar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-2 border-t border-[#d5bf86]/30 bg-[#fbfaf3] flex justify-end">
            <button
              type="button"
              onClick={() => setIsBottomHudHidden(false)}
              className="text-[11px] font-mono font-bold text-luxury-maroon hover:text-luxury-crimson flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#d5bf86]/40 shadow-xs hover:bg-luxury-gold/10 transition-colors"
              title="Restore Station Taskbar"
            >
              <ChevronUp className="w-3.5 h-3.5 text-luxury-crimson" />
              <span>Show Station Taskbar</span>
            </button>
          </div>
        )}
      </div>

      {/* 
        =============================================================================
        SECTION 2: END-TO-END COMPUTATIONAL WORKFLOW & OPERATIONAL MODULES
        =============================================================================
      */}
      <div className="bg-gradient-to-r from-[#fcfbf7] via-white to-[#f8f7ee] rounded-2xl p-6 sm:p-8 text-luxury-maroon shadow-md border border-[#d5bf86]/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-luxury-gold/25 text-luxury-maroon text-[11px] font-bold border border-luxury-gold/50">
              <Sparkles className="w-3.5 h-3.5 text-luxury-crimson" />
              Docking Verification Pipeline
            </div>
            <h3 className="text-xl font-black tracking-tight text-luxury-maroon">
              Drug–Protein Molecular Docking
            </h3>
            <p className="text-xs text-luxury-taupe font-medium leading-relaxed">
              Interactive in silico platform for simulating candidate drug binding affinities with structural macromolecules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/docking')}
              className="bg-gradient-to-r from-luxury-maroon to-luxury-crimson text-luxury-cream text-xs font-bold shadow-md hover:shadow-lg transition-all"
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Open Docking Workspace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/prototype')}
              className="bg-white text-luxury-maroon border-[#d5bf86]/60 hover:bg-luxury-gold/20 text-xs transition-colors font-semibold"
            >
              Physical Prototype Guide
            </Button>
          </div>
        </div>

        {/* Workflow Stepper */}
        <div className="mt-8 pt-6 border-t border-indigo-500/30 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              End-to-End Molecular Docking Workflow
            </span>
            <span className="text-[11px] text-slate-400">Click any stage to inspect module</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
            {[
              { name: 'Target Protein', route: '/proteins', step: '01' },
              { name: 'Candidate Molecule', route: '/ligands', step: '02' },
              { name: 'Binding Site', route: '/docking', step: '03' },
              { name: 'Docking', route: '/docking', step: '04' },
              { name: 'Results', route: '/results', step: '05' },
              { name: 'Interaction Analysis', route: '/results', step: '06' },
              { name: '3D Visualization', route: '/results', step: '07' },
              { name: 'Comparison', route: '/comparison', step: '08' },
              { name: 'Report', route: '/reports', step: '09' },
            ].map((stage, idx, arr) => (
              <div
                key={stage.name}
                onClick={() => navigate(stage.route)}
                className="p-3 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 hover:border-indigo-400 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/80 group-hover:text-indigo-400">
                  <span>{stage.step}</span>
                  {idx < arr.length - 1 && <span className="hidden lg:inline text-cyan-300">→</span>}
                </div>
                <span className="font-semibold text-slate-200 group-hover:text-white leading-tight mt-1 text-[11px]">
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 
        =============================================================================
        SECTION 3: 5 CORE FORENSIC METRICS & ACTIONS
        =============================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Cases"
          value={stats.activeCases}
          icon={Briefcase}
          variant="blue"
          subtitle="Cases requiring action"
          onClick={() => navigate('/cases')}
          badge={<Badge variant="primary" size="sm">Open</Badge>}
        />
        <StatCard
          title="Tests Conducted"
          value={stats.testsConducted}
          icon={FlaskConical}
          variant="indigo"
          subtitle="Presumptive screenings"
          onClick={() => navigate('/field-tests')}
        />
        <StatCard
          title="Pending Samples"
          value={stats.pendingSamples}
          icon={Package}
          variant="amber"
          subtitle="Awaiting lab or test"
          onClick={() => navigate('/samples')}
          badge={stats.pendingSamples > 0 ? <Badge variant="warning" size="sm">Pending</Badge> : undefined}
        />
        <StatCard
          title="Reports Generated"
          value={stats.reportsGenerated}
          icon={FileText}
          variant="emerald"
          subtitle="Auditable summaries"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Unsynced Records"
          value={stats.unsyncedRecords}
          icon={RefreshCw}
          variant={stats.unsyncedRecords > 0 ? 'rose' : 'emerald'}
          subtitle={isOnline ? 'Online - Ready' : 'Local IndexedDB'}
          onClick={() => navigate('/sync')}
          badge={
            stats.unsyncedRecords > 0 ? (
              <Badge variant="danger" size="sm" dot>Queue</Badge>
            ) : (
              <Badge variant="success" size="sm">Synced</Badge>
            )
          }
        />
      </div>

      {/* Sync Status Banner */}
      <div className="bg-navy-900/40 backdrop-blur-md rounded-xl p-4 border border-cyan-500/30 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {isOnline ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-cyan-100">
                {isOnline ? 'Cloud Relay Connection Available' : 'Offline Field Operation Mode'}
              </span>
              <Badge variant={isOnline ? 'success' : 'danger'} size="sm" dot>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
            <p className="text-xs text-cyan-400/80 mt-0.5">
              {stats.unsyncedRecords > 0
                ? `${stats.unsyncedRecords} field action(s) stored locally in IndexedDB pending upload.`
                : 'All local records are synchronized with central field database.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Synchronize Now
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sync')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Queue
          </Button>
        </div>
      </div>

      {/* Recent Cases & Recent Field Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Table (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Field Cases</CardTitle>
                <p className="text-xs text-cyan-400/80 mt-0.5">Latest incidents registered locally</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cases')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                All Cases
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-navy-950/60 text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider">
                      <th className="py-3 px-4">Case #</th>
                      <th className="py-3 px-4">Title & Location</th>
                      <th className="py-3 px-4">Lead Officer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/20 text-xs">
                    {recentCases.map((c) => (
                      <tr key={c.id} className="hover:bg-cyan-950/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-cyan-50">
                          {c.caseNumber}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-cyan-100 truncate">{c.title}</div>
                          <div className="text-[11px] text-cyan-400/80 truncate flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatShortDate(c.incidentDate || c.createdAt)} •{' '}
                            {typeof c.location === 'object'
                              ? c.location.address || 'Scene'
                              : c.location || 'Scene'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300">
                          {c.assignedOfficer || c.leadOfficerName}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getCaseStatusVariant(c.status)} size="sm">
                            {formatStatusLabel(c.status)}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className="text-cyan-400 hover:text-cyan-200 font-medium inline-flex items-center gap-1"
                          >
                            Details
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Field Tests (1 col) */}
        <div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Field Tests</CardTitle>
                <p className="text-xs text-cyan-400/80 mt-0.5">Screening observations</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/field-tests')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                View
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentTests.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-cyan-500/20 bg-navy-950/60 hover:bg-cyan-950/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-cyan-100">
                      {t.testNumber}
                    </span>
                    <Badge variant={getTestOutcomeVariant(t.resultStatus)} size="sm">
                      {t.resultStatus === 'PRESUMPTIVE_POSITIVE'
                        ? 'Presumptive Positive'
                        : formatStatusLabel(t.resultStatus)}
                    </Badge>
                  </div>
                  <div className="text-xs text-cyan-200 font-medium mt-1 truncate">
                    {t.kitType}
                  </div>
                  {t.presumptiveCategory && (
                    <div className="text-[11px] text-cyan-400/80 mt-0.5">
                      Target: <span className="font-medium text-cyan-200">{t.presumptiveCategory}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-cyan-500/20">
                    <span>{t.performedBy}</span>
                    <span>{formatDate(t.timestamp)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Advisory */}
      <div className="p-4 rounded-xl bg-slate-900/90 text-slate-400 border border-cyan-500/20 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200 block mb-0.5">
            Computational In Silico Prediction & Laboratory Confirmatory Advisory
          </span>
          Molecular docking calculations evaluate potential binding affinities and active-site geometric poses. All predicted affinities (kcal/mol) represent computational approximations and require experimental validation (e.g., surface plasmon resonance or isothermal titration calorimetry).
        </div>
      </div>
    </div>
  );
};
