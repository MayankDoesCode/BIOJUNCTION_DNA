import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Wifi,
  WifiOff,
  User as UserIcon,
  ChevronDown,
  Building,
  LogOut,
  UserCheck,
  Shield,
  ArrowRightLeft,
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService, DEMO_STANDARD_PASSWORD } from '../services/authService';
import type { User, UserRole } from '../types';
import { Badge } from '../components/common/Badge';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
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
    <header className="h-16 bg-navy-900/40 backdrop-blur-md border-b border-cyan-500/30/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Left: Mobile hamburger & Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-cyan-300 hover:text-cyan-50 hover:bg-navy-800/60 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-cyan-400/80">
          <Building className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-cyan-200">{user.agency}</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-cyan-400/80">Terminal #04</span>
        </div>
      </div>

      {/* Right: Connectivity Status & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Offline / Online Network Indicator */}
        <div className="flex items-center">
          {isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs"
              title="Application is ONLINE. Background synchronization active."
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>ONLINE</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs animate-pulse"
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
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800/60 border border-transparent hover:border-cyan-500/30 transition-colors focus:outline-none"
            aria-expanded={showUserMenu}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-xs">
              <UserIcon className="w-4 h-4 text-slate-200" />
            </div>
            <div className="hidden md:block text-left text-xs leading-tight">
              <div className="font-semibold text-cyan-100">{user.fullName}</div>
              <div className="text-[11px] text-cyan-400/80 font-mono">{user.badgeNumber}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-navy-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 z-40 py-2 divide-y divide-slate-100 animate-in fade-in duration-150 text-xs">
                {/* Profile Header */}
                <div className="px-4 py-3 bg-navy-950/60/70">
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
