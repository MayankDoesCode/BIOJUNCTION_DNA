import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  CheckCircle2,
  Clock,
  Building,
  Mail,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { authService, DEMO_STANDARD_PASSWORD } from '../services/authService';
import type { User, UserRole } from '../types';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  // New Provision Form State
  const [newOperator, setNewOperator] = useState({
    fullName: '',
    username: '',
    email: '',
    agency: 'State Bureau of Forensic Operations',
    badgeNumber: '',
    role: 'FIELD_OFFICER' as UserRole,
    password: DEMO_STANDARD_PASSWORD,
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
      showToast('Error loading user directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const pendingUsers = users.filter((u) => !u.active && u.approvalStatus !== 'REJECTED');
  const activeUsers = users.filter((u) => u.active);
  const rejectedUsers = users.filter((u) => !u.active && u.approvalStatus === 'REJECTED');

  const handleApprove = async (userId: string, role?: UserRole) => {
    try {
      await authService.approveUser(userId, role);
      showToast('Operator access approved and activated!', 'success');
      await loadUsers();
    } catch (err) {
      showToast('Failed to approve user', 'error');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await authService.rejectUser(userId);
      showToast('Access request denied', 'info');
      await loadUsers();
    } catch (err) {
      showToast('Failed to deny request', 'error');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await authService.toggleUserActive(userId, !currentStatus);
      showToast(`User account ${!currentStatus ? 'activated' : 'suspended'}`, 'info');
      await loadUsers();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove user record "${name}"?`)) {
      return;
    }
    try {
      await authService.deleteUser(userId);
      showToast(`User "${name}" removed`, 'info');
      await loadUsers();
    } catch (err) {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperator.fullName || !newOperator.username || !newOperator.email) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      const res = await authService.register({
        ...newOperator,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to create user', 'error');
        return;
      }

      // Immediately activate since created by Admin
      if (res.user) {
        await authService.approveUser(res.user.id, newOperator.role);
      }

      showToast(`New operator ${newOperator.fullName} provisioned and activated!`, 'success');
      setIsProvisionModalOpen(false);
      setNewOperator({
        fullName: '',
        username: '',
        email: '',
        agency: 'State Bureau of Forensic Operations',
        badgeNumber: '',
        role: 'FIELD_OFFICER',
        password: DEMO_STANDARD_PASSWORD,
      });
      await loadUsers();
    } catch (err) {
      showToast('Failed to provision user', 'error');
    }
  };

  const filteredActiveUsers = activeUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <LoadingSpinner size="lg" label="Loading personnel access directory..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Operator Access Control & User Management"
        subtitle="Review access requests, approve personnel authorizations, and manage active terminal security roles."
        actions={
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsProvisionModalOpen(true)}
            className="bg-luxury-crimson hover:bg-luxury-maroon text-white font-bold"
          >
            Provision New Operator
          </Button>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-luxury-maroon">
            {pendingUsers.length}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">
            {pendingUsers.length > 0 ? 'Requires Admin Action' : 'All Requests Cleared'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Active Operators</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {activeUsers.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Authorized to Terminal</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Suspended / Denied</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-700">
            {rejectedUsers.length}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold">Access Blocked</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#d5bf86]/40 shadow-xs">
          <div className="flex items-center justify-between text-luxury-taupe text-xs font-semibold">
            <span>Total Directory</span>
            <Users className="w-4 h-4 text-luxury-crimson" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-luxury-maroon">
            {users.length}
          </div>
          <span className="text-[11px] text-luxury-taupe font-semibold">All Registered Profiles</span>
        </div>
      </div>

      {/* SECTION 1: Pending Access Requests (Only visible if requests exist or empty state) */}
      <Card className="p-6 border-amber-300 bg-gradient-to-br from-white to-amber-50/30">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-bold text-luxury-maroon">
              Pending Access Authorization Requests
            </h3>
            {pendingUsers.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold font-mono">
                {pendingUsers.length} NEW
              </span>
            )}
          </div>
          <span className="text-xs text-luxury-taupe font-semibold">
            Only System Administrators can grant access
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-luxury-taupe space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-semibold text-sm text-luxury-maroon">No pending access requests.</p>
            <p className="text-xs max-w-md mx-auto">
              When new operators submit a registration request on the login page, they will appear here for your review and approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((applicant) => (
              <div
                key={applicant.id}
                className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-luxury-maroon">{applicant.fullName}</h4>
                      <span className="text-xs text-luxury-taupe font-mono">@{applicant.username}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                      Requested: {applicant.role}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-luxury-taupe">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>{applicant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>{applicant.agency}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-luxury-gold" />
                      <span>Badge: {applicant.badgeNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-semibold text-luxury-taupe">Assign Role:</label>
                    <select
                      defaultValue={applicant.role}
                      id={`role_select_${applicant.id}`}
                      className="px-2 py-1 rounded-lg border border-[#d5bf86]/60 text-xs font-bold text-luxury-maroon bg-white"
                    >
                      <option value="FIELD_OFFICER">FIELD_OFFICER</option>
                      <option value="LAB_USER">LAB_USER</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="VIEWER">VIEWER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(applicant.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById(
                          `role_select_${applicant.id}`
                        ) as HTMLSelectElement;
                        handleApprove(applicant.id, (sel?.value as UserRole) || applicant.role);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Approve & Grant Access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SECTION 2: Active Authorized Operators Directory */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#d5bf86]/30">
          <div>
            <h3 className="text-base font-bold text-luxury-maroon">Authorized Operator Registry</h3>
            <p className="text-xs text-luxury-taupe">Active personnel authorized to access terminal vaults, case files, and molecular simulations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-luxury-taupe absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search operators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#d5bf86]/60 bg-white focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#d5bf86]/60 text-xs font-semibold text-luxury-maroon bg-white focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="FIELD_OFFICER">FIELD_OFFICER</option>
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="LAB_USER">LAB_USER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#d5bf86]/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a0509] text-[#f1f0cc]">
              <tr>
                <th className="p-3">Operator</th>
                <th className="p-3">Badge & Agency</th>
                <th className="p-3">Security Role</th>
                <th className="p-3">Access Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredActiveUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-luxury-taupe">
                    No active operators found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredActiveUsers.map((op) => (
                  <tr key={op.id} className="hover:bg-luxury-cream/30">
                    <td className="p-3">
                      <div className="font-bold text-luxury-maroon">{op.fullName}</div>
                      <div className="text-[11px] text-luxury-taupe font-mono">
                        @{op.username} • {op.email}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-luxury-crimson font-semibold">
                        {op.badgeNumber}
                      </div>
                      <div className="text-[11px] text-luxury-taupe">{op.agency}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-maroon border border-luxury-gold/40 text-[10px] font-bold font-mono">
                        {op.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(op.id, op.active)}
                        className="text-[11px] text-amber-700 hover:text-amber-900 font-bold hover:underline"
                        title="Suspend operator access"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleDeleteUser(op.id, op.fullName)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline"
                        title="Remove user"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provision Operator Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#d5bf86]/50 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#d5bf86]/30">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-luxury-crimson" />
                <h3 className="text-lg font-bold text-luxury-maroon">Provision New Operator</h3>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1 rounded-lg text-luxury-taupe hover:text-luxury-maroon"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-luxury-maroon mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={newOperator.fullName}
                    onChange={(e) =>
                      setNewOperator({ ...newOperator, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                  />
                </div>
                <div>
                  <label className="block font-bold text-luxury-maroon mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. j.doe"
                    value={newOperator.username}
                    onChange={(e) =>
                      setNewOperator({ ...newOperator, username: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-luxury-maroon mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.doe@forensics.agency.gov"
                  value={newOperator.email}
                  onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-luxury-maroon mb-1">Badge / ID #</label>
                  <input
                    type="text"
                    placeholder="e.g. TX-9844"
                    value={newOperator.badgeNumber}
                    onChange={(e) =>
                      setNewOperator({ ...newOperator, badgeNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                  />
                </div>
                <div>
                  <label className="block font-bold text-luxury-maroon mb-1">Security Role</label>
                  <select
                    value={newOperator.role}
                    onChange={(e) =>
                      setNewOperator({ ...newOperator, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs font-bold text-luxury-maroon bg-white focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                  >
                    <option value="FIELD_OFFICER">FIELD_OFFICER</option>
                    <option value="LAB_USER">LAB_USER</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-luxury-maroon mb-1">Agency / Unit</label>
                <input
                  type="text"
                  value={newOperator.agency}
                  onChange={(e) => setNewOperator({ ...newOperator, agency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                />
              </div>

              <div>
                <label className="block font-bold text-luxury-maroon mb-1">
                  Default Password
                </label>
                <input
                  type="text"
                  value={newOperator.password}
                  onChange={(e) =>
                    setNewOperator({ ...newOperator, password: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#d5bf86]/60 text-xs font-mono text-luxury-maroon focus:outline-none focus:ring-1 focus:ring-luxury-crimson"
                />
                <span className="text-[10px] text-luxury-taupe mt-1 block">
                  Defaults to standard secure field password (FieldTesting2026!).
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-luxury-crimson hover:bg-luxury-maroon text-white font-bold"
                >
                  Create & Activate Operator
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
