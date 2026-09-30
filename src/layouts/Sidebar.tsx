import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FlaskConical,
  Package,
  Shield,
  FileText,
  RefreshCw,
  History,
  Settings,
  X,
  BadgeAlert,
  UserCheck,
  Dna,
  Pill,
  Crosshair,
  Sparkles,
  BarChart3,
  Box,
  Database,
  Users,
  PanelLeftClose,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '../types';
import { BioJunctionLogo } from '../components/common/BioJunctionLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingSyncCount?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  section?: 'main' | 'docking' | 'field';
  permission?: Permission | Permission[];
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  pendingSyncCount = 0,
}) => {
  const { user, hasPermission } = useAuth();

  const allNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },

    // Drug–Protein Molecular Docking
    { name: 'Target Proteins', href: '/proteins', icon: Dna, section: 'docking' },
    { name: 'Candidate Ligands', href: '/ligands', icon: Pill, section: 'docking' },
    { name: 'Docking Workspace', href: '/docking', icon: Crosshair, section: 'docking' },
    { name: 'Docking Results', href: '/results', icon: Sparkles, section: 'docking' },
    { name: 'Candidate Comparison', href: '/comparison', icon: BarChart3, section: 'docking' },
    { name: 'Physical Prototype', href: '/prototype', icon: Box, section: 'docking' },
    { name: 'Dataset Manager', href: '/datasets', icon: Database, section: 'docking', badge: '150+' },

    // Forensic Field Operations (Preserved)
    { name: 'Cases', href: '/cases', icon: Briefcase, permission: 'CASE_VIEW', section: 'field' },
    { name: 'Field Tests', href: '/field-tests', icon: FlaskConical, permission: ['FIELD_TEST_CREATE', 'FIELD_TEST_EDIT'], section: 'field' },
    { name: 'Samples', href: '/samples', icon: Package, permission: 'SAMPLE_VIEW', section: 'field' },
    { name: 'Evidence', href: '/evidence', icon: Shield, permission: ['EVIDENCE_ADD', 'CASE_VIEW'], section: 'field' },
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'REPORT_VIEW', section: 'field' },
    {
      name: 'Sync',
      href: '/sync',
      icon: RefreshCw,
      badge: pendingSyncCount > 0 ? pendingSyncCount : undefined,
      section: 'field',
    },
    { name: 'Audit Log', href: '/audit-log', icon: History, permission: 'AUDIT_VIEW', section: 'field' },
    { name: 'User Management', href: '/users', icon: Users, permission: 'SETTINGS_MANAGE', section: 'field' },
    { name: 'Settings', href: '/settings', icon: Settings, permission: 'SETTINGS_MANAGE', section: 'field' },
  ];

  // Filter items dynamically based on RBAC permissions
  const authorizedNavItems = allNavItems.filter((item) => {
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) {
      return item.permission.some((perm) => hasPermission(perm));
    }
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#1a0509] text-[#f1f0cc] flex flex-col transition-all duration-300 ease-in-out border-r border-[#d5bf86]/30 shadow-2xl',
          'lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-40',
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 lg:translate-x-0',
          isCollapsed
            ? 'lg:-translate-x-full lg:-ml-72 lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0 pointer-events-none'
            : 'lg:translate-x-0 lg:ml-0 lg:w-72 lg:opacity-100'
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-[#d5bf86]/25 bg-[#1a0509]">
          <BioJunctionLogo size="sm" variant="dark" />
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-[#d5bf86] hover:text-white hover:bg-white/10 hidden lg:flex items-center justify-center transition-colors"
                title="Hide Taskbar (Collapse sidebar)"
                aria-label="Hide Taskbar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#d5bf86] hover:text-white hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legal / Field Compliance Disclaimer Ribbon */}
        <div className="bg-[#110205] px-4 py-2 text-[11px] text-[#d5bf86] border-b border-[#d5bf86]/20 flex items-center gap-2">
          <BadgeAlert className="w-3.5 h-3.5 text-[#a71d31] shrink-0" />
          <span className="truncate font-semibold tracking-wide">Authorized Molecular Lab Terminal</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* Main Category */}
          <div className="space-y-1">
            {authorizedNavItems
              .filter((i) => i.section === 'main')
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group select-none relative',
                        isActive
                          ? 'bg-gradient-to-r from-[#a71d31] to-[#731322] text-white shadow-md font-bold'
                          : 'text-[#f1f0cc]/80 hover:text-white hover:bg-white/10'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-colors" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
          </div>

          {/* Molecular Docking Category */}
          <div className="space-y-1 pt-3 border-t border-[#d5bf86]/20">
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#d5bf86]">
              Molecular Docking Suite
            </div>
            {authorizedNavItems
              .filter((i) => i.section === 'docking')
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold transition-all group select-none relative',
                        isActive
                          ? 'bg-gradient-to-r from-[#a71d31] to-[#731322] text-white shadow-md font-bold'
                          : 'text-[#f1f0cc]/80 hover:text-white hover:bg-white/10'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 transition-colors" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
          </div>

          {/* Field Operations Category */}
          <div className="space-y-1 pt-3 border-t border-[#d5bf86]/20">
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#d5bf86]/80">
              Field Operations & Custody
            </div>
            {authorizedNavItems
              .filter((i) => i.section === 'field')
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold transition-all group select-none relative',
                        isActive
                          ? 'bg-gradient-to-r from-[#a71d31] to-[#731322] text-white shadow-md font-bold'
                          : 'text-[#f1f0cc]/80 hover:text-white hover:bg-white/10'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 transition-colors" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d5bf86]/20 text-[#d5bf86] border border-[#d5bf86]/40">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </div>

          {/* Quick Collapse Action for Desktop */}
          {onToggleCollapse && (
            <div className="pt-2 hidden lg:block">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#d5bf86]/25 text-xs font-semibold text-[#d5bf86] hover:text-white transition-all shadow-xs"
                title="Hide Navigation Taskbar"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Hide Taskbar</span>
              </button>
            </div>
          )}
        </nav>

        {/* Sidebar Footer with Active Role Identification */}
        <div className="p-4 border-t border-[#d5bf86]/20 bg-[#110205] space-y-2">
          {user && (
            <div className="bg-[#240a10] rounded-xl p-3 border border-[#d5bf86]/30 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-4 h-4 text-[#d5bf86] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-[#d5bf86] font-mono">
                    {user.badgeNumber}
                  </div>
                </div>
              </div>
              <span className="text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-luxury-gold/20 text-[#d5bf86] border border-luxury-gold/40 shrink-0">
                {user.role}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#d5bf86]/70 pt-1">
            <span className="font-mono text-[10px] font-bold text-[#d5bf86]/80">v2.6-BIOJUNCTION</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
