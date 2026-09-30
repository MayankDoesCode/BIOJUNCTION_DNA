import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Building,
  CheckCircle2,
  XCircle,
  LogOut,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../utils/permissions';
import type { Permission } from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, logout } = useAuth();

  if (!user) {
    return null;
  }

  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  const allPermissions: Permission[] = [
    'CASE_CREATE',
    'CASE_VIEW',
    'CASE_EDIT',
    'FIELD_TEST_CREATE',
    'FIELD_TEST_EDIT',
    'SAMPLE_CREATE',
    'SAMPLE_VIEW',
    'EVIDENCE_ADD',
    'REPORT_VIEW',
    'REPORT_REVIEW',
    'AUDIT_VIEW',
    'SETTINGS_MANAGE',
  ];

  const handleLogout = async () => {
    await logout('USER_LOGOUT_FROM_PROFILE');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Operator Security Profile"
        subtitle="Operational credentials, assigned permissions, and active terminal session metadata"
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            End Field Session
          </Button>
        }
      />

      {/* Operator Identity Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <p className="text-xs text-cyan-400/80 mt-0.5">
                Badge: <span className="font-mono font-semibold text-cyan-200">{user.badgeNumber}</span> • User ID: <span className="font-mono text-cyan-300">{user.id}</span>
              </p>
            </div>
          </div>
          <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'SUPERVISOR' ? 'warning' : 'primary'}>
            {user.role}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-navy-950/60 p-4 rounded-xl border border-cyan-500/30">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Official Agency
              </span>
              <div className="flex items-center gap-1.5 font-medium text-cyan-100">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.agency}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Official Email
              </span>
              <span className="font-medium text-cyan-100">{user.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Account Status
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Field Operator
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Session Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-600" />
            <CardTitle>Session Security Manifest</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30">
              <span className="text-cyan-400/80 block text-[11px] mb-1">Session Initialized:</span>
              <span className="font-mono text-cyan-100 font-medium">
                {session ? formatDate(session.createdAt) : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30">
              <span className="text-cyan-400/80 block text-[11px] mb-1">Session Expires At:</span>
              <span className="font-mono text-amber-700 font-medium">
                {session ? formatDate(session.expiresAt) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-slate-300 rounded-lg font-mono text-[11px] break-all border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase mb-1">
              Simulated Bearer Token Digest:
            </span>
            {session ? session.token : 'NO_ACTIVE_SESSION'}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600" />
            <CardTitle>Assigned Role Permissions ({userPermissions.length} Active)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allPermissions.map((perm) => {
              const isGranted = userPermissions.includes(perm);
              return (
                <div
                  key={perm}
                  className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors ${
                    isGranted
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-navy-950/60/80 border-cyan-500/30 text-slate-400'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isGranted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-[11px]">
                      {perm}
                    </div>
                    <div className="text-[10px] mt-0.5 text-cyan-300">
                      {PERMISSION_DESCRIPTIONS[perm]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
