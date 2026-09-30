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
  UserPlus,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService, DEMO_STANDARD_PASSWORD } from '../services/authService';
import type { User, UserRole } from '../types';
import { BioJunctionLogo } from '../components/common/BioJunctionLogo';
import { DnaSequencingBackground } from '../components/common/DnaSequencingBackground';

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

  // Mode: LOGIN or SIGNUP
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Sign Up form state
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    username: '',
    email: '',
    agency: 'State Bureau of Forensic Operations',
    badgeNumber: '',
    role: 'FIELD_OFFICER' as UserRole,
    password: '',
    confirmPassword: '',
  });
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    if (!signUpData.fullName.trim() || !signUpData.username.trim() || !signUpData.email.trim()) {
      setSignUpError('Please fill in your full name, username, and official email.');
      return;
    }

    if (!signUpData.password) {
      setSignUpError('Please enter a secure password.');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setSignUpError('Passwords do not match. Please verify both password entries.');
      return;
    }

    try {
      setIsSigningUp(true);
      const res = await authService.register({
        fullName: signUpData.fullName,
        username: signUpData.username,
        email: signUpData.email,
        agency: signUpData.agency,
        badgeNumber: signUpData.badgeNumber,
        role: signUpData.role,
        password: signUpData.password,
      });

      if (!res.success) {
        setSignUpError(res.error || 'Failed to submit registration.');
      } else {
        setSignUpSuccess(
          `Your access request has been submitted for ${signUpData.fullName} (@${signUpData.username}). Notice: Terminal security requires a System Administrator (Commander Reyes) to approve and activate your account before you can log in.`
        );
        showToast('Access request submitted for Admin review', 'success');
      }
    } catch (err) {
      setSignUpError((err as Error).message);
    } finally {
      setIsSigningUp(false);
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
    <div className="relative min-h-screen bg-luxury-cream text-luxury-maroon flex flex-col justify-between selection:bg-luxury-crimson selection:text-luxury-cream overflow-x-hidden font-sans">
      {/* 
        Live DNA Sequencing Background with soft warm ambient overlays
      */}
      <DnaSequencingBackground intensity="subtle" />

      {/* Warm Glow Overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#f1f0cc]/70 via-[#f8f7ee]/60 to-[#f1f0cc]/80 backdrop-blur-[1px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(213,191,134,0.18),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(167,29,49,0.10),transparent_55%)] pointer-events-none" />

      {/* Top Security Status Ribbon */}
      <header className="relative z-10 bg-white/85 backdrop-blur-md border-b border-[#d5bf86]/40 px-4 sm:px-6 py-3 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-luxury-maroon hover:text-luxury-crimson transition-colors py-1 px-2.5 rounded-lg hover:bg-luxury-gold/20 border border-[#d5bf86]/40 font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-wide">Back to Portal</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#d5bf86]/40 text-luxury-taupe font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-xs">Forensic Access & Molecular Docking Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-luxury-taupe">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM ONLINE
          </span>
          <span className="text-luxury-gold">•</span>
          <span className="font-bold text-luxury-maroon">AES-256 VAULT</span>
          <span className="text-luxury-gold hidden sm:inline">•</span>
          <span className="hidden sm:inline">TERMINAL TER-4091A</span>
        </div>
      </header>

      {/* Center Screen Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl rounded-[28px] sm:rounded-[36px] bg-white/90 backdrop-blur-2xl border border-[#d5bf86]/50 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[#d5bf86]/80">
          
          {/* Subtle Inner Bevel Accent */}
          <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] pointer-events-none border border-white/80" />

          {/* Top HUD Frame Bar */}
          <div className="px-6 py-4 border-b border-[#d5bf86]/30 flex items-center justify-between bg-gradient-to-r from-[#fbfaf3] via-white to-[#f8f7ee]">
            {/* Top Left Navigation Link */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-1 text-luxury-maroon hover:text-luxury-crimson font-mono text-xs font-bold tracking-wider transition-colors px-2 py-1 rounded hover:bg-luxury-gold/15"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-luxury-crimson" />
                <span>&lt; Login</span>
              </Link>
              <span className="text-[#d5bf86] text-xs hidden sm:inline">|</span>
              <span className="text-[11px] font-mono tracking-widest text-luxury-taupe uppercase font-semibold hidden sm:inline">
                Molecular Docking Subsystem
              </span>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-3 text-luxury-taupe">
              <button
                type="button"
                onClick={() => showToast('HUD Diagnostic Log: All services operational', 'info')}
                className="p-1.5 rounded-lg hover:bg-luxury-gold/20 hover:text-luxury-maroon transition-colors"
                title="Search Records"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => showToast('Zero active security alerts detected.', 'info')}
                className="p-1.5 rounded-lg hover:bg-luxury-gold/20 hover:text-luxury-maroon transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-luxury-crimson animate-pulse" />
              </button>
              <div className="w-7 h-7 rounded-full overflow-hidden border border-luxury-gold p-0.5">
                <img
                  src="/images/dr-vance-avatar.jpg"
                  alt="Dr. E. Vance"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#d5bf86]/30">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: Authentication Vault Form                                      */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center relative bg-white/70">
              {/* Subtle background glow circle behind form */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-luxury-gold/20 rounded-full blur-3xl pointer-events-none" />

              {/* BioJunction Biological Logo Emblem */}
              <div className="text-center relative z-10 mb-4 flex flex-col items-center">
                <BioJunctionLogo size="lg" variant="light" className="mb-2" />
                <p className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-luxury-taupe pt-1">
                  SECURE RESEARCH ACCESS
                </p>
              </div>

              {/* Tab Switcher: Login vs Request Access */}
              <div className="flex bg-[#f1f0cc]/80 p-1 rounded-full border border-[#d5bf86]/50 max-w-xs mx-auto mb-5 relative z-10 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setErrorMessage(null);
                    setSignUpError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all ${
                    authMode === 'LOGIN'
                      ? 'bg-luxury-maroon text-white shadow-xs'
                      : 'text-luxury-taupe hover:text-luxury-maroon'
                  }`}
                >
                  Terminal Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGNUP');
                    setErrorMessage(null);
                    setSignUpError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all ${
                    authMode === 'SIGNUP'
                      ? 'bg-luxury-maroon text-white shadow-xs'
                      : 'text-luxury-taupe hover:text-luxury-maroon'
                  }`}
                >
                  Request Access
                </button>
              </div>

              {authMode === 'LOGIN' ? (
                /* ======================== LOGIN FORM ======================== */
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full relative z-10">
                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in duration-150 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold block text-rose-300">Authentication Alert</span>
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
                        className={`w-full px-5 py-3.5 rounded-full bg-white/90 border text-sm text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson/40 transition-all shadow-xs ${
                          validationErrors.identifier
                            ? 'border-rose-500 ring-1 ring-rose-400'
                            : 'border-[#d5bf86]/60 hover:border-luxury-crimson focus:border-luxury-crimson'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-luxury-taupe">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    </div>
                    {validationErrors.identifier && (
                      <span className="text-[11px] text-rose-600 pl-4 block font-medium">
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
                        className={`w-full px-5 py-3.5 pr-12 rounded-full bg-white/90 border text-sm text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson/40 transition-all shadow-xs ${
                          validationErrors.password
                            ? 'border-rose-500 ring-1 ring-rose-400'
                            : 'border-[#d5bf86]/60 hover:border-luxury-crimson focus:border-luxury-crimson'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-luxury-taupe hover:text-luxury-maroon focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <span className="text-[11px] text-rose-600 pl-4 block font-medium">
                        {validationErrors.password}
                      </span>
                    )}
                  </div>

                  {/* Remember Session Toggle */}
                  <div className="flex items-center justify-between px-2 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-luxury-taupe hover:text-luxury-maroon font-semibold">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#d5bf86] text-luxury-crimson focus:ring-luxury-crimson"
                      />
                      <span>Remember this device</span>
                    </label>
                  </div>

                  {/* Big Luxury Gradient Login Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full font-bold text-luxury-cream text-base tracking-wide bg-gradient-to-r from-luxury-maroon via-luxury-crimson to-luxury-maroon hover:opacity-95 shadow-xl shadow-luxury-maroon/25 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                  {/* Sub-action Links */}
                  <div className="flex items-center justify-between text-xs px-3 pt-2 text-luxury-taupe font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          'Demo Environment Hint: Select any authorized operator profile on the right panel or use "FieldTesting2026!".',
                          'info',
                          'Password Recovery'
                        )
                      }
                      className="hover:text-luxury-crimson transition-colors underline-offset-4 hover:underline"
                    >
                      Forgot Password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('SIGNUP')}
                      className="hover:text-luxury-crimson text-luxury-maroon font-bold transition-colors underline-offset-4 hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Request New Access
                    </button>
                  </div>
                </form>
              ) : (
                /* ======================== SIGN UP / ACCESS REQUEST FORM ======================== */
                <div className="max-w-md mx-auto w-full relative z-10 space-y-4">
                  {signUpSuccess ? (
                    <div className="p-6 bg-emerald-50/90 border border-emerald-300 rounded-3xl text-center space-y-4 shadow-sm animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-emerald-950 mb-1">
                          Access Request Submitted!
                        </h4>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          {signUpSuccess}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200 text-[11px] text-emerald-900 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Admin Approval Workflow</span>
                        </div>
                        <p className="text-emerald-800">
                          To simulate approval right now, log in as <strong>Commander Reyes (Admin)</strong> and open <strong>User Management</strong> in the sidebar to click <em>"Approve & Grant Access"</em>.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('LOGIN');
                            setSignUpSuccess(null);
                          }}
                          className="w-full py-2.5 px-4 rounded-full bg-luxury-maroon hover:bg-luxury-crimson text-white font-bold text-xs shadow-md transition-all"
                        >
                          Return to Terminal Login
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Quick fill admin
                            const adminUser = demoUsers.find((u) => u.role === 'ADMIN');
                            if (adminUser) handleSelectDemoUser(adminUser);
                            setAuthMode('LOGIN');
                            setSignUpSuccess(null);
                          }}
                          className="text-xs text-luxury-crimson font-bold hover:underline"
                        >
                          Log in as Admin (Commander Reyes) to approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-3">
                      {signUpError && (
                        <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in duration-150 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold block text-rose-300">Registration Error</span>
                            {signUpError}
                          </div>
                        </div>
                      )}

                      {/* Admin Approval Notice Banner */}
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong>Admin Approval Required:</strong> All newly submitted registrations remain locked until reviewed and approved by an Administrator.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Full Name *"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Username *"
                          value={signUpData.username}
                          onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        />
                      </div>

                      <input
                        type="email"
                        required
                        placeholder="Official Agency Email *"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                      />

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Badge / Personnel ID"
                          value={signUpData.badgeNumber}
                          onChange={(e) => setSignUpData({ ...signUpData, badgeNumber: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        />
                        <select
                          value={signUpData.role}
                          onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value as UserRole })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs font-bold text-luxury-maroon focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        >
                          <option value="FIELD_OFFICER">Role: Field Officer</option>
                          <option value="LAB_USER">Role: Lab Specialist</option>
                          <option value="SUPERVISOR">Role: Supervisor</option>
                          <option value="VIEWER">Role: Read-Only Viewer</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        placeholder="Agency / Department Name"
                        value={signUpData.agency}
                        onChange={(e) => setSignUpData({ ...signUpData, agency: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                      />

                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="password"
                          required
                          placeholder="Password *"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Confirm Password *"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full bg-white/90 border border-[#d5bf86]/60 text-xs text-luxury-maroon placeholder:text-luxury-taupe/60 focus:outline-none focus:ring-2 focus:ring-luxury-crimson"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSigningUp}
                        className="w-full py-3.5 px-6 rounded-full font-bold text-luxury-cream text-sm tracking-wide bg-gradient-to-r from-luxury-maroon via-luxury-crimson to-luxury-maroon hover:opacity-95 shadow-xl shadow-luxury-maroon/25 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                      >
                        {isSigningUp ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Access Request...</span>
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Submit Access Request to Admin
                          </span>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setAuthMode('LOGIN')}
                          className="text-xs text-luxury-taupe hover:text-luxury-maroon font-semibold"
                        >
                          Already have an authorized profile? <span className="text-luxury-crimson font-bold underline">Login here</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: Verified Activity Records & Dr. Vance Operator Profile      */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-[#fbfaf3] to-[#f8f7ee]">
              
              {/* Top Section: Recent Verified Docking Runs / Case Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-luxury-crimson" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-luxury-maroon font-bold">
                      Docking Telemetry Feed
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-luxury-taupe font-bold">LIVE SYNC</span>
                </div>

                {/* List items */}
                <div className="space-y-2">
                  {recentActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white/90 hover:bg-white border border-[#d5bf86]/40 hover:border-luxury-crimson/50 transition-all duration-200 flex items-center justify-between group cursor-default shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-luxury-maroon truncate flex items-center gap-1.5">
                          <span>{act.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-luxury-gold/25 text-luxury-maroon border border-luxury-gold/50">
                            {act.pdbId}
                          </span>
                        </div>
                        <div className="text-[10px] text-luxury-taupe font-medium truncate pt-0.5">
                          {act.target}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono text-luxury-taupe font-bold">
                          {act.date}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 font-bold pt-0.5">
                          {act.affinity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Operator Profile (Dr. E. Vance) */}
              <div className="mt-6 pt-5 border-t border-[#d5bf86]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-black tracking-wider text-luxury-taupe">
                    Active Station Operator
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Terminal Ready
                  </span>
                </div>

                {/* Featured Doctor Profile Card */}
                <div 
                  onClick={() => handleSelectDemoUser(drVanceUser)}
                  className="p-3.5 rounded-2xl bg-white border border-luxury-gold hover:border-luxury-crimson flex items-center justify-between cursor-pointer group shadow-sm transition-all hover:shadow-md"
                  title="Click to load Dr. Vance credentials"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src="/images/dr-vance-avatar.jpg"
                        alt="Dr. E. Vance"
                        className="w-11 h-11 rounded-full object-cover border-2 border-luxury-gold shadow-xs group-hover:border-luxury-crimson transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-luxury-maroon group-hover:text-luxury-crimson transition-colors flex items-center gap-1.5">
                        <span>Dr. E. Vance</span>
                        <Badge variant={getRoleBadgeVariant(drVanceUser.role)} size="sm">
                          {drVanceUser.role}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-luxury-taupe font-mono truncate">
                        Special Investigations Taskforce
                      </div>
                      <div className="text-[10px] text-luxury-crimson font-mono pt-0.5 font-bold">
                        Badge: {drVanceUser.badgeNumber} • @{drVanceUser.username}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-full bg-luxury-gold/30 hover:bg-luxury-crimson hover:text-luxury-cream text-luxury-maroon text-[10px] font-bold border border-luxury-gold/60 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <UserCheck className="w-3 h-3 text-luxury-crimson group-hover:text-luxury-cream" />
                      <span>Autofill</span>
                    </button>
                  </div>
                </div>

                {/* Other Pre-Configured Demo Profiles Quick Switcher */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-luxury-taupe font-mono mb-1.5 font-medium">
                    <span>Other Demo Profiles:</span>
                    <span>Demo Password: FieldTesting2026!</span>
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
                          className="px-2 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#d5bf86]/40 hover:border-luxury-crimson text-left transition-all group shadow-xs"
                        >
                          <div className="font-bold text-[10px] text-luxury-maroon group-hover:text-luxury-crimson truncate">
                            {u.fullName.split(' ')[1] || u.fullName}
                          </div>
                          <div className="text-[9px] text-luxury-taupe uppercase truncate font-semibold">
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
      <footer className="relative z-10 bg-white/80 backdrop-blur-md border-t border-[#d5bf86]/40 px-4 py-3 text-center text-[11px] text-luxury-taupe font-medium">
        <p>
          Strictly authorized for molecular docking validation and in silico simulation.
          All telemetric transactions and pose evaluations are logged securely under BIOJUNCTION protocol RFC-2026.
        </p>
      </footer>
    </div>
  );
};
