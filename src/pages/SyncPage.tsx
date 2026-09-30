import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Server,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { syncRepository } from '../database/repositories/syncRepository';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatters';
import type { SyncRecord } from '../types';

export const SyncPage: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { showToast } = useToast();
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueue = async () => {
    try {
      const data = await syncRepository.getAll();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load sync queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.triggerManualSync();
      if (res.success) {
        showToast(res.message, 'success', 'Queue Synced');
      } else {
        showToast(res.message, 'warning', 'Sync Notice');
      }
      await loadQueue();
    } catch {
      showToast('Sync operation encountered an error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = records.filter((r) => r.status === 'PENDING').length;
  const syncedCount = records.filter((r) => r.status === 'SYNCED').length;
  const failedCount = records.filter((r) => r.status === 'FAILED').length;

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'SYNCED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Inspecting local replication queue..." className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Synchronization & Local Store"
        subtitle="Local-first offline queue manager and central server replication state"
        badge={
          <Badge variant={pendingCount > 0 ? 'warning' : 'success'} size="md" dot>
            {pendingCount} Pending Queued
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={handleSyncAll}
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Run Manual Sync
          </Button>
        }
      />

      {/* Sync Topology Diagnostics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-brand-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-cyan-400/80">Local Store</span>
              <div className="text-sm font-bold text-cyan-50 mt-0.5">IndexedDB: FieldTestingDB</div>
              <span className="text-[11px] text-emerald-600 font-medium">Ready & Persistent</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-cyan-400/80">Radio Status</span>
              <div className="text-sm font-bold text-cyan-50 mt-0.5">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              <span className="text-[11px] text-cyan-400/80">
                {isOnline ? 'Direct link available' : 'Local mutations queued'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-cyan-400/80">Target Backend</span>
              <div className="text-sm font-bold text-cyan-50 mt-0.5">FastAPI Cloud Vault</div>
              <span className="text-[11px] text-cyan-400/80 font-mono">http://localhost:8000</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Queue Diagnostics Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Replication Transaction Queue</CardTitle>
              <p className="text-xs text-cyan-400/80 mt-0.5">
                Mutations awaiting secure server ingest
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">{pendingCount} Pending</Badge>
              <Badge variant="success" size="sm">{syncedCount} Synced</Badge>
              {failedCount > 0 && <Badge variant="danger" size="sm">{failedCount} Failed</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-navy-950/60/70 text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Enqueued At</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-950/60/70">
                    <td className="py-3.5 px-4 font-mono font-medium text-cyan-100">
                      {r.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-cyan-200">
                      {r.entityType}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] bg-navy-800/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {r.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-400/80">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-mono">
                      {r.attempts}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={getStatusVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
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
