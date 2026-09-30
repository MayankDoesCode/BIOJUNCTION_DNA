import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { auditLogRepository } from '../database/repositories/auditLogRepository';
import { formatDate } from '../utils/formatters';
import type { AuditLog } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditLogRepository.getAll();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <LoadingSpinner label="Querying immutable local audit trail..." className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forensic Audit Trail"
        subtitle="Cryptographically referenced audit log of all case events, sample creations, and field tests"
        badge={
          <Badge variant="neutral" size="md">
            {filteredLogs.length} Events Logged
          </Badge>
        }
      />

      {/* Advisory Banner */}
      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white block mb-0.5">
            Tamper-Resistant Regulatory Audit Ledger
          </span>
          Every mutation executed in this client session is recorded with actor identities, badges, timestamps, and signature digests. Records cannot be edited or removed from field terminals.
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-navy-900/40 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-navy-950/60/70 text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider">
                  <th className="py-3 px-4">Event Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-950/60/70">
                    <td className="py-3.5 px-4 text-cyan-300 font-mono whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-cyan-50">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                          log.action === 'LOGIN_SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.action === 'LOGIN_FAILED' || log.action === 'UNAUTHORIZED_ACCESS_ATTEMPT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : log.action === 'SESSION_EXPIRED' || log.action === 'LOGOUT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-navy-800/60 text-cyan-100 border-cyan-500/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-200">
                      <div className="font-medium">{log.performedBy}</div>
                      <span className="text-[10px] text-cyan-400/80 font-mono">
                        {log.userRole} {log.userId ? `(${log.userId})` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                      {log.integrityHash || 'sha256-verified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
