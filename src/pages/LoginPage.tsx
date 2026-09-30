import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  Search,
  Bell,
  Layers,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService, DEMO_STANDARD_PASSWORD } from '../services/authService';
import type { User, UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ identifier?: string; password?: string }>({});

  const demoUsers = authService.getAvailableDemoUsers();

  // Find Dr. Vance (or default supervisor)
  const drVanceUser = demoUsers.find(
    (u) => u.username === 'm.vance' || u.fullName.toLowerCase().includes('vance')
  ) || demoUsers[0];

  // Destination after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = 'Please provide an authorized username or official email';
    }
    if (!password) {
      errors.password = 'Password signature is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      if (result.success) {
        showToast('Operator authenticated. Terminal vault unlocked.', 'success', 'Session Established');
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || 'Authentication denied. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected terminal security error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoUser = (user: User) => {
    setIdentifier(user.username);
    setPassword(DEMO_STANDARD_PASSWORD);
    setErrorMessage(null);
    setValidationErrors({});
    showToast(`Loaded ${user.role} profile (${user.fullName})`, 'info');
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'SUPERVISOR':
        return 'warning';
      case 'FIELD_OFFICER':
        return 'primary';
      case 'LAB_USER':
        return 'success';
      default:
        return 'neutral';
    }
  };

  // Recent verified binding activity entries (matching the concept image)
  const recentActivities = [
    {
      title: 'Drug Protein-DNA Binding',
      date: 'May 21, 2026',
      pdbId: '7KFT',
      target: 'DNA Gyrase • Ciprofloxacin',
      affinity: '-9.4 kcal/mol',
      status: 'VERIFIED',
    },
    {
      title: 'Drug Protein-DNA Binding',
      date: 'Apr 23, 2026',
      pdbId: '1BNA',
      target: 'B-DNA Dodecamer • Netropsin',
      affinity: '-10.8 kcal/mol',
      status: 'VERIFIED',
    },
    {
      title: 'Drug Protein-DNA Binding',
      date: 'Apr 22, 2026',
      pdbId: '6VXX',
      target: 'SARS-CoV-2 RdRp • Remdesivir',
      affinity: '-8.9 kcal/mol',
      status: 'COMPLETED',
    },
    {
      title: 'Bio-Synthesis Analysis',
      date: 'Apr 8, 2026',
      pdbId: '4ASD',
      target: 'VEGFR2 Kinase • Axitinib',
      affinity: '-11.2 kcal/mol',
      status: 'ARCHIVED',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-navy-950 overflow-x-hidden font-sans">
      {/* 
        Laboratory Photorealistic Background with dark holographic overlay
      */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('/images/auth-bg.jpg')` }}
      />
      {/* Vignette & Holographic Glow Overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/75 to-navy-950/90 backdrop-blur-[2px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(6,182,212,0.18),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(217,70,239,0.12),transparent_55%)] pointer-events-none" />

      {/* Top Security Status Ribbon */}
      <header className="relative z-10 bg-navy-950/80 backdrop-blur-md border-b border-cyan-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 transition-colors py-0.5 px-2 rounded-lg hover:bg-cyan-500/10 border border-cyan-500/20"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-wide">Back to Portal</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-cyan-500/20 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-xs">Forensic Field Access & Docking Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-cyan-300/80">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM ONLINE
          </span>
          <span className="text-cyan-600">•</span>
          <span>AES-256 VAULT</span>
          <span className="text-cyan-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">TERMINAL TER-4091A</span>
        </div>
      </header>

      {/* Center Holographic HUD Screen Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl rounded-[28px] sm:rounded-[36px] bg-[#040e1f]/75 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.22),0_20px_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-300 hover:border-cyan-300/60">
          
          {/* Subtle Glass HUD Inner Bevel Accent */}
          <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] pointer-events-none border border-cyan-300/10" />

          {/* Top HUD Frame Bar */}
          <div className="px-6 py-3.5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-slate-900/20 to-fuchsia-950/20">
            {/* Top Left Navigation Link matching `< Login` in concept image */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-1 text-cyan-300 hover:text-cyan-100 font-mono text-xs tracking-wider transition-colors px-2 py-1 rounded hover:bg-cyan-500/10"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>&lt; Login</span>
              </Link>
              <span className="text-cyan-500/40 text-xs hidden sm:inline">|</span>
              <span className="text-[11px] font-mono tracking-widest text-cyan-400/70 uppercase hidden sm:inline">
                Quantum Docking Subsystem
              </span>
            </div>

            {/* Top Right HUD Action Icons */}
            <div className="flex items-center gap-3 text-cyan-400/80">
              <button
                type="button"
                onClick={() => showToast('HUD Diagnostic Log: All services operational', 'info')}
                className="p-1.5 rounded-lg hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors"
                title="Search Records"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => showToast('Zero active security alerts detected.', 'info')}
                className="p-1.5 rounded-lg hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </button>
              <div className="w-7 h-7 rounded-full overflow-hidden border border-cyan-400/40 p-0.5">
                <img
                  src="/images/dr-vance-avatar.jpg"
                  alt="Dr. E. Vance"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* 2-Column Holographic Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-cyan-500/20">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: Holographic Authentication Vault Form                         */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center relative">
              {/* Subtle background glow circle behind form */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing Heart-Padlock & DNA Double-Helix Emblem */}
              <div className="text-center relative z-10 mb-6">
                <div className="relative inline-flex items-center justify-center mb-3">
                  {/* Custom Neon Heart-Lock + DNA SVG */}
                  <svg
                    viewBox="0 0 160 140"
                    className="w-24 h-24 sm:w-28 sm:h-28 mx-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] filter"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <linearGradient id="neon-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>

                    {/* Ambient Glow */}
                    <circle cx="80" cy="70" r="42" fill="#06b6d4" opacity="0.12" filter="url(#neon-glow)" />

                    {/* DNA Helix Strands Wrapping Around the Lock (Left Strand Cyan) */}
                    <path
                      d="M 28 42 C 40 48, 55 75, 45 98 C 38 114, 25 125, 42 135"
                      stroke="url(#neon-cyan)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#neon-glow)"
                    />
                    {/* DNA Helix Strands (Right Strand Pink/Magenta) */}
                    <path
                      d="M 132 42 C 120 48, 105 75, 115 98 C 122 114, 135 125, 118 135"
                      stroke="url(#neon-pink)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#neon-glow)"
                    />

                    {/* Base Pairs Connecting Strands */}
                    <line x1="33" y1="46" x2="48" y2="52" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2 2" />
                    <line x1="127" y1="46" x2="112" y2="52" stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" />
                    <line x1="44" y1="76" x2="56" y2="78" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2 2" />
                    <line x1="116" y1="76" x2="104" y2="78" stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" />
                    <line x1="42" y1="102" x2="58" y2="100" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2 2" />
                    <line x1="118" y1="102" x2="102" y2="100" stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" />

                    {/* Heart-Shaped Padlock Shackle */}
                    <path
                      d="M 64 56 V 42 C 64 33, 71 26, 80 26 C 89 26, 96 33, 96 42 V 56"
                      stroke="url(#neon-cyan)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      filter="url(#neon-glow)"
                    />

                    {/* Heart-Shaped Padlock Body */}
                    <path
                      d="M 80 114 C 44 92, 48 60, 68 56 C 76 54, 80 60, 80 60 C 80 60, 84 54, 92 56 C 112 60, 116 92, 80 114 Z"
                      fill="#031124"
                      stroke="url(#neon-cyan)"
                      strokeWidth="4"
                      filter="url(#neon-glow)"
                    />

                    {/* Keyhole inside Heart */}
                    <circle cx="80" cy="78" r="5" fill="#e0f2fe" filter="url(#neon-glow)" />
                    <polygon points="77,80 83,80 84,92 76,92" fill="#e0f2fe" filter="url(#neon-glow)" />

                    {/* Holographic Sparkles */}
                    <circle cx="68" cy="38" r="1.5" fill="#ffffff" />
                    <circle cx="95" cy="48" r="1.5" fill="#fbcfe8" />
                    <circle cx="58" cy="94" r="1.5" fill="#67e8f9" />
                    <circle cx="102" cy="94" r="1.5" fill="#f472b6" />
                  </svg>
                </div>

                {/* Title matching concept image */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-cyan-200">
                  BIO-SYNTHESIS
                </h1>
                <p className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-cyan-400 pt-0.5">
                  ANALYTICS
                </p>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full relative z-10">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in duration-150 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold block text-rose-300">Authentication Failed</span>
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Username or Email Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (validationErrors.identifier) {
                          setValidationErrors((prev) => ({ ...prev, identifier: undefined }));
                        }
                      }}
                      placeholder="Username or Email"
                      autoComplete="username"
                      className={`w-full px-5 py-3.5 rounded-full bg-[#030d1d]/80 border text-sm text-cyan-50 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all ${
                        validationErrors.identifier
                          ? 'border-rose-400 ring-1 ring-rose-400'
                          : 'border-cyan-500/40 hover:border-cyan-400/70 focus:border-cyan-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-cyan-400/60">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </div>
                  {validationErrors.identifier && (
                    <span className="text-[11px] text-rose-400 pl-4 block">
                      {validationErrors.identifier}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="Password"
                      autoComplete="current-password"
                      className={`w-full px-5 py-3.5 pr-12 rounded-full bg-[#030d1d]/80 border text-sm text-cyan-50 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all ${
                        validationErrors.password
                          ? 'border-rose-400 ring-1 ring-rose-400'
                          : 'border-cyan-500/40 hover:border-cyan-400/70 focus:border-cyan-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-cyan-400/70 hover:text-cyan-200 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="text-[11px] text-rose-400 pl-4 block">
                      {validationErrors.password}
                    </span>
                  )}
                </div>

                {/* Remember Session Toggle */}
                <div className="flex items-center justify-between px-2 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-cyan-300/80 hover:text-cyan-200">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-cyan-500/40 bg-navy-950 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                {/* Big Neon Gradient Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full font-bold text-white text-base tracking-wide bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 hover:from-cyan-300 hover:via-sky-300 hover:to-pink-500 shadow-[0_0_30px_rgba(6,182,212,0.55)] hover:shadow-[0_0_40px_rgba(217,70,239,0.7)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Vault...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>

                {/* Sub-action Links matching the concept image */}
                <div className="flex items-center justify-between text-xs px-3 pt-2 text-cyan-400/80">
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Demo Environment Hint: Select any authorized operator profile on the right panel or use "FieldTesting2026!".',
                        'info',
                        'Password Recovery'
                      )
                    }
                    className="hover:text-cyan-200 transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Access Request: New credential issuances are authorized via agency cryptographic keys.',
                        'info',
                        'Operator Provisioning'
                      )
                    }
                    className="hover:text-cyan-200 transition-colors underline-offset-4 hover:underline"
                  >
                    Request Access
                  </button>
                </div>
              </form>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: Verified Activity Records & Dr. Vance Operator Profile      */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-[#030b17]/50 to-[#02070f]/80">
              
              {/* Top Section: Recent Verified Docking Runs / Case Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                      Docking Telemetry Feed
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-500/70">LIVE SYNC</span>
                </div>

                {/* List items matching concept image */}
                <div className="space-y-2">
                  {recentActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 flex items-center justify-between group cursor-default"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-cyan-100 group-hover:text-cyan-50 truncate flex items-center gap-1.5">
                          <span>{act.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {act.pdbId}
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-400/70 truncate pt-0.5">
                          {act.target}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono text-cyan-400/90 font-medium">
                          {act.date}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                          {act.affinity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Operator Profile (Dr. E. Vance) matching image */}
              <div className="mt-6 pt-5 border-t border-cyan-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400/80">
                    Active Station Operator
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Terminal Ready
                  </span>
                </div>

                {/* Featured Doctor Profile Card */}
                <div 
                  onClick={() => handleSelectDemoUser(drVanceUser)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-navy-900/40 to-fuchsia-950/30 border border-cyan-400/40 hover:border-cyan-300 p-3 flex items-center justify-between cursor-pointer group shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                  title="Click to load Dr. Vance credentials"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src="/images/dr-vance-avatar.jpg"
                        alt="Dr. E. Vance"
                        className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:border-cyan-300 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-navy-950 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                        <span>Dr. E. Vance</span>
                        <Badge variant={getRoleBadgeVariant(drVanceUser.role)} size="sm">
                          {drVanceUser.role}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono truncate">
                        Special Investigations Taskforce
                      </div>
                      <div className="text-[10px] text-cyan-500/70 font-mono pt-0.5">
                        Badge: {drVanceUser.badgeNumber} • @{drVanceUser.username}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[10px] font-bold border border-cyan-400/40 group-hover:border-cyan-300 transition-all flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3 text-cyan-300" />
                      <span>Autofill</span>
                    </button>
                  </div>
                </div>

                {/* Other Pre-Configured Demo Profiles Quick Switcher */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400/70 font-mono mb-1.5">
                    <span>Other Demo Profiles:</span>
                    <span>Standard Demo Password: FieldTesting2026!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {demoUsers
                      .filter((u) => u.id !== drVanceUser.id)
                      .slice(0, 3)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectDemoUser(u)}
                          className="px-2 py-1.5 rounded-xl bg-navy-950/70 hover:bg-cyan-950/60 border border-cyan-500/20 hover:border-cyan-400/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-[10px] text-cyan-200 group-hover:text-white truncate">
                            {u.fullName.split(' ')[1] || u.fullName}
                          </div>
                          <div className="text-[9px] text-cyan-400/60 uppercase truncate">
                            {u.role.replace('_', ' ')}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Compliance & Legal Footer */}
      <footer className="relative z-10 bg-navy-950/90 border-t border-cyan-500/20 px-4 py-2.5 text-center text-[11px] text-cyan-400/70 font-mono">
        <p>
          Strictly authorized for forensic drug verification and molecular docking validation.
          All telemetric transactions and pose evaluations are logged securely under protocol RFC-2026.
        </p>
      </footer>
    </div>
  );
};
