import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  User as UserIcon,
  ChevronDown,
  Building,
  LogOut,
  UserCheck,
  Shield,
  ArrowRightLeft,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService, DEMO_STANDARD_PASSWORD } from '../services/authService';
import type { User, UserRole } from '../types';
import { Badge } from '../components/common/Badge';

interface HeaderProps {
  onOpenSidebar: () => void;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  isSidebarHidden = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const { user, logout, login } = useAuth();
  const { showToast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const demoUsers = authService.getAvailableDemoUsers();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout('USER_LOGOUT_HEADER');
    showToast('Field session ended', 'info');
    navigate('/login');
  };

  const handleQuickSwitchRole = async (targetUser: User) => {
    setShowUserMenu(false);
    await login({
      identifier: targetUser.username,
      password: DEMO_STANDARD_PASSWORD,
      rememberMe: false,
    });
    showToast(`Switched operator profile to ${targetUser.role}`, 'success');
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

  if (!user) {
    return null;
  }

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#d5bf86]/40 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs text-luxury-maroon">
      {/* Left: Taskbar Toggle & Agency Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (onToggleSidebar) {
              onToggleSidebar();
            } else {
              onOpenSidebar();
            }
          }}
          className="p-2 rounded-xl text-luxury-maroon hover:text-luxury-crimson hover:bg-luxury-gold/20 border border-[#d5bf86]/40 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs focus:outline-none"
          title={isSidebarHidden ? 'Show Taskbar / Navigation (Ctrl+B)' : 'Hide Taskbar / Navigation'}
          aria-label="Toggle taskbar navigation"
        >
          {isSidebarHidden ? (
            <PanelLeftOpen className="w-4 h-4 text-luxury-crimson" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-luxury-maroon" />
          )}
          <span className="hidden sm:inline font-mono">
            {isSidebarHidden ? 'Show Taskbar' : 'Hide Taskbar'}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-luxury-taupe font-medium">
          <Building className="w-4 h-4 text-luxury-taupe" />
          <span className="font-bold text-luxury-maroon">{user.agency}</span>
          <span className="text-luxury-gold">/</span>
          <span className="font-mono text-luxury-taupe">Molecular Terminal #04</span>
        </div>
      </div>

      {/* Right: Connectivity Status & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Offline / Online Network Indicator */}
        <div className="flex items-center">
          {isOnline ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs"
              title="Application is ONLINE. Background synchronization active."
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>ONLINE</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold shadow-xs animate-pulse"
              title="Application is OFFLINE. All changes cached in IndexedDB."
            >
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span>OFFLINE</span>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-luxury-gold/15 border border-transparent hover:border-luxury-gold/40 transition-colors focus:outline-none"
            aria-expanded={showUserMenu}
          >
            <div className="w-9 h-9 rounded-full bg-luxury-maroon text-luxury-cream flex items-center justify-center font-bold text-xs shadow-sm">
              <UserIcon className="w-4 h-4 text-luxury-cream" />
            </div>
            <div className="hidden md:block text-left text-xs leading-tight">
              <div className="font-bold text-luxury-maroon">{user.fullName}</div>
              <div className="text-[11px] text-luxury-taupe font-mono">{user.badgeNumber}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-luxury-taupe" />
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-luxury-gold/40 z-40 py-2 divide-y divide-luxury-taupe/15 animate-in fade-in duration-150 text-xs">
                {/* Profile Header */}
                <div className="px-4 py-3 bg-luxury-cream/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-50">{user.fullName}</span>
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-cyan-400/80 mt-1">{user.email}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-cyan-500/30/60">
                    <span>Badge: {user.badgeNumber}</span>
                    <span>UID: {user.id}</span>
                  </div>
                </div>

                {/* Profile Navigation Links */}
                <div className="px-2 py-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-cyan-200 hover:bg-navy-800/60 flex items-center gap-2 font-medium"
                  >
                    <UserCheck className="w-4 h-4 text-brand-600" />
                    <span>Security Profile & Permissions</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-cyan-200 hover:bg-navy-800/60 flex items-center gap-2 font-medium"
                  >
                    <Shield className="w-4 h-4 text-cyan-400/80" />
                    <span>Terminal Hardware Settings</span>
                  </button>
                </div>

                {/* Role Switcher Demo Tool */}
                <div className="px-3 py-2 bg-navy-950/60/40">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Quick Switch Role (Prototype Demo):</span>
                  </div>
                  <div className="space-y-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleQuickSwitchRole(u)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                          u.id === user.id
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'hover:bg-navy-800/60 text-cyan-200'
                        }`}
                      >
                        <div className="truncate">
                          <div>{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">{u.badgeNumber}</div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                          {u.role}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log Out CTA */}
                <div className="px-2 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>End Field Session (Log Out)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
