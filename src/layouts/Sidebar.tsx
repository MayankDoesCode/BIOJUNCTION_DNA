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
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, pendingSyncCount = 0 }) => {
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
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/60 shadow-xl lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-900/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                Digital Companion
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-400 block">
                Field Drug Testing
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal / Field Compliance Disclaimer Ribbon */}
        <div className="bg-slate-900/90 px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800 flex items-center gap-2">
          <BadgeAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Authorized Forensic Field Use Only</span>
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
                        'flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-medium transition-all group select-none relative overflow-hidden',
                        isActive
                          ? 'bg-brand-600/90 text-white shadow-md font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
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
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Molecular Docking Prototype
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
                        'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all group select-none relative overflow-hidden',
                        isActive
                          ? 'bg-indigo-600/90 text-white shadow-md font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
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
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
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
                        'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all group select-none relative overflow-hidden',
                        isActive
                          ? 'bg-brand-600/90 text-white shadow-md font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 transition-colors" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </div>
        </nav>

        {/* Sidebar Footer with Active Role Identification */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
          {user && (
            <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-4 h-4 text-brand-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-cyan-400/80 font-mono">
                    {user.badgeNumber}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 shrink-0">
                {user.role}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="font-mono text-[11px] text-cyan-400/80">v0.2.0-stage2</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CJIS RBAC Active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
