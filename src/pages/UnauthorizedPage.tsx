import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { PERMISSION_DESCRIPTIONS } from '../utils/permissions';
import type { Permission } from '../types';

interface UnauthorizedPageProps {
  requiredPermission?: Permission;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ requiredPermission }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout('ROLE_SWITCH_REQUEST');
    navigate('/login');
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-navy-900/40 backdrop-blur-md rounded-2xl shadow-xl border border-rose-200 overflow-hidden">
        {/* Warning Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 ring-8 ring-rose-50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-rose-950">
            403 — Operational Clearance Restricted
          </h2>
          <p className="text-xs text-rose-700 mt-1 max-w-xs">
            Your assigned role does not hold the necessary security permissions to access this field module.
          </p>
        </div>

        {/* Security Context Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-navy-950/60 rounded-xl p-3.5 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400/80">Authenticated Personnel:</span>
              <span className="font-semibold text-cyan-100">{user?.fullName || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-400/80">Assigned Role:</span>
              <Badge variant="warning" size="sm">{user?.role || 'None'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-400/80">Badge / Operator ID:</span>
              <span className="font-mono text-cyan-200">{user?.badgeNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-400/80">Attempted Route:</span>
              <span className="font-mono text-cyan-300 truncate max-w-[180px]">{location.pathname}</span>
            </div>
            {requiredPermission && (
              <div className="pt-2 border-t border-cyan-500/30">
                <span className="text-cyan-400/80 block mb-0.5">Required Permission:</span>
                <span className="font-mono text-xs font-semibold text-rose-700 block">
                  {requiredPermission}
                </span>
                <span className="text-[11px] text-cyan-400/80">
                  {PERMISSION_DESCRIPTIONS[requiredPermission] || ''}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
            <strong>Audit Record Logged:</strong> This access denial was captured on the forensic terminal audit trail with timestamp and operator cryptographic signature.
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              leftIcon={<Home className="w-4 h-4" />}
              className="flex-1"
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4 text-cyan-400/80" />}
              className="flex-1"
            >
              Switch Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
