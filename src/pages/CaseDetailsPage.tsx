import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Shield,
  MapPin,
  User,
  FlaskConical,
  Package,
  FileText,
  History,
  AlertTriangle,
  Compass,
  Archive,
  CheckCircle2,
  Layers,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusTransitionModal } from '../components/cases/StatusTransitionModal';
import { caseRepository } from '../database/repositories/caseRepository';
import { fieldTestRepository } from '../database/repositories/fieldTestRepository';
import { sampleRepository } from '../database/repositories/sampleRepository';
import { evidenceRepository } from '../database/repositories/evidenceRepository';
import { reportRepository } from '../database/repositories/reportRepository';
import { auditLogRepository } from '../database/repositories/auditLogRepository';
import { auditService } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatDate, formatShortDate, formatStatusLabel } from '../utils/formatters';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  CASE_PRIORITY_COLORS,
  CASE_WORKFLOW_STEPS,
  getAllowedNextStatuses,
} from '../../src/utils/caseWorkflow';
import type {
  Case,
  CaseStatus,
  FieldTest,
  Sample,
  Evidence,
  Report,
  AuditLog,
} from '../types';

type TabKey = 'overview' | 'tests' | 'samples' | 'evidence' | 'reports' | 'audit';

export const CaseDetailsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // Connected Module Records
  const [tests, setTests] = useState<FieldTest[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadCaseData = async () => {
    if (!caseId) return;
    try {
      const found = await caseRepository.getById(caseId);
      if (!found) {
        setCaseItem(null);
        return;
      }
      setCaseItem(found);

      // Concurrently query related records for timeline and tabs
      const [tList, sList, eList, rList, aList] = await Promise.all([
        fieldTestRepository.getByCaseId(caseId),
        sampleRepository.getByCaseId(caseId),
        evidenceRepository.getByCaseId(caseId),
        reportRepository.getAll(),
        auditLogRepository.getAll(),
      ]);

      setTests(tList);
      setSamples(sList);
      setEvidence(eList);
      setReports(rList.filter((r) => r.caseId === caseId));
      
      // Filter audit logs specifically tied to this case record
      setAuditLogs(
        aList.filter(
          (a) =>
            a.entityId === caseId ||
            a.details?.includes(found.caseNumber) ||
            (a.metadata && JSON.stringify(a.metadata).includes(caseId))
        )
      );
    } catch (err) {
      console.error('Failed to load case details:', err);
      showToast('Error loading field case file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const handleStatusTransition = async (nextStatus: CaseStatus, reason?: string) => {
    if (!caseItem || !user) return;
    try {
      const prevStatus = caseItem.status;
      await caseRepository.updateCase(caseItem.id, { status: nextStatus });

      await auditService.record(
        'STATUS_CHANGED',
        'Case',
        caseItem.id,
        `Status transitioned from ${prevStatus} to ${nextStatus}.${reason ? ` Reason: ${reason}` : ''}`,
        user
      );

      showToast(`Case status updated to ${formatStatusLabel(nextStatus)}`, 'success');
      await loadCaseData();
    } catch {
      showToast('Failed to transition case status', 'error');
    }
  };

  const handleArchiveCase = async () => {
    if (!caseItem || !user) return;
    if (!window.confirm(`Are you sure you want to archive case ${caseItem.caseNumber}? It will be stored in immutable archival mode.`)) {
      return;
    }

    try {
      await caseRepository.archiveCase(caseItem.id);
      await auditService.record(
        'CASE_ARCHIVED',
        'Case',
        caseItem.id,
        `Case ${caseItem.caseNumber} archived by ${user.fullName}`,
        user
      );
      showToast(`Case ${caseItem.caseNumber} moved to archive`, 'success');
      navigate('/cases');
    } catch {
      showToast('Error archiving case', 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Decrypting and loading field case dossier..." className="h-96" />;
  }

  if (!caseItem) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Case Record Not Found"
          description="The requested case identifier does not exist in local encrypted storage."
          actionLabel="Return to Cases"
          onAction={() => navigate('/cases')}
        />
      </div>
    );
  }

  const allowedNext = getAllowedNextStatuses(caseItem.status, user?.role);
  const locationObj = typeof caseItem.location === 'object' ? caseItem.location : { address: caseItem.location };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between text-xs text-cyan-400/80">
        <button
          onClick={() => navigate('/cases')}
          className="hover:text-cyan-100 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Field Cases
        </button>
        {caseItem.isArchived && (
          <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
            Archived Case File
          </span>
        )}
      </div>

      {/* Main Header Card */}
      <div className="bg-navy-900/40 backdrop-blur-md rounded-2xl p-6 border border-cyan-500/30 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-base font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
              {caseItem.caseNumber}
            </span>
            <Badge variant={CASE_STATUS_COLORS[caseItem.status]} size="md" dot>
              {CASE_STATUS_LABELS[caseItem.status]}
            </Badge>
            <Badge variant={CASE_PRIORITY_COLORS[caseItem.priority]} size="md">
              Priority: {caseItem.priority}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-cyan-50 mt-2 tracking-tight">
            {caseItem.title}
          </h1>
          <p className="text-xs text-cyan-400/80 mt-1 flex items-center gap-2">
            <span>Investigating Officer: <strong>{caseItem.assignedOfficer || caseItem.leadOfficerName || 'Unassigned'}</strong></span>
            <span>•</span>
            <span>Recorded: {formatShortDate(caseItem.createdAt)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {allowedNext.length > 0 && user?.role !== 'VIEWER' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowTransitionModal(true)}
              leftIcon={<Shield className="w-4 h-4 text-brand-600" />}
            >
              Transition Status
            </Button>
          )}

          {hasPermission('CASE_EDIT') && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/cases/${caseItem.id}/edit`)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit Case
            </Button>
          )}

          {hasPermission('CASE_DELETE') && !caseItem.isArchived && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleArchiveCase}
              leftIcon={<Archive className="w-4 h-4 text-cyan-400/80" />}
              className="text-cyan-200 hover:text-rose-600"
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Status Progression Stepper */}
      {caseItem.status !== 'CANCELLED' && (
        <Card className="p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-cyan-200 uppercase tracking-wider text-[10px]">
              Procedural Lifecycle Stepper
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Phase: {CASE_STATUS_LABELS[caseItem.status]}
            </span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-[650px] justify-between relative">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
              {CASE_WORKFLOW_STEPS.map((step, idx) => {
                const currentIndex = CASE_WORKFLOW_STEPS.indexOf(caseItem.status);
                const isPassed = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm animate-pulse'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-navy-900/40 backdrop-blur-md border-2 border-cyan-400/40 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 whitespace-nowrap font-medium ${
                        isCurrent
                          ? 'font-bold text-brand-700'
                          : isPassed
                          ? 'text-cyan-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-cyan-500/30 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Case Overview', icon: Layers },
          { key: 'tests', label: `Field Tests (${tests.length})`, icon: FlaskConical },
          { key: 'samples', label: `Samples (${samples.length})`, icon: Package },
          { key: 'evidence', label: `Evidence (${evidence.length})`, icon: Lock },
          { key: 'reports', label: `Reports (${reports.length})`, icon: FileText },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-cyan-400/80 hover:text-cyan-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Case Information */}
          <Card>
            <CardHeader>
              <CardTitle>Investigative Observations & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Incident Description
                </span>
                <p className="text-cyan-200 leading-relaxed bg-navy-950/60 p-3 rounded-lg border border-cyan-500/30">
                  {caseItem.description || 'No detailed incident description logged.'}
                </p>
              </div>

              {caseItem.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Field Operational Notes
                  </span>
                  <p className="text-cyan-300 bg-amber-50/50 p-3 rounded-lg border border-amber-200 italic">
                    "{caseItem.notes}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Incident Date</span>
                  <span className="font-medium text-cyan-100">
                    {formatDate(caseItem.incidentDate || caseItem.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Urgency / Priority</span>
                  <Badge variant={CASE_PRIORITY_COLORS[caseItem.priority]} size="sm">
                    {caseItem.priority}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card B: Location & Checkpoint */}
          <Card>
            <CardHeader>
              <CardTitle>Field Location & Geographic Coordinates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Incident Address or Mile Marker
                </span>
                <div className="flex items-start gap-2 bg-navy-950/60 p-3 rounded-lg border border-cyan-500/30">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span className="font-semibold text-cyan-100">
                    {locationObj.address || 'Address unrecorded'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-navy-950/60 p-3 rounded-lg border border-cyan-500/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Latitude</span>
                  <span className="font-mono font-medium text-cyan-100">
                    {locationObj.latitude !== undefined ? `${locationObj.latitude}° N` : 'Not calibrated'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Longitude</span>
                  <span className="font-mono font-medium text-cyan-100">
                    {locationObj.longitude !== undefined ? `${locationObj.longitude}° W` : 'Not calibrated'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Coordinates saved to secure offline cache. Tamper-evident GPS sync active.</span>
              </div>
            </CardContent>
          </Card>

          {/* Card C: Assignment & Personnel */}
          <Card>
            <CardHeader>
              <CardTitle>Case Assignment & Responsible Personnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Lead / Assigned Officer</span>
                  <span className="font-bold text-cyan-50 text-sm">
                    {caseItem.assignedOfficer || caseItem.leadOfficerName || 'Specialist J. Miller'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Logged By</span>
                  <span className="text-cyan-200 font-medium">{caseItem.createdBy || 'Authorized Field Specialist'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reporting Agency</span>
                  <span className="text-cyan-200 font-medium">{caseItem.agency || 'State Bureau of Forensic Operations'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card D: Digital Record Manifest */}
          <Card>
            <CardHeader>
              <CardTitle>Digital Ledger Manifest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-cyan-400/80">Record Internal ID:</span>
                <span className="font-mono text-cyan-200">{caseItem.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-cyan-400/80">Created Timestamp:</span>
                <span className="font-mono text-cyan-200">{formatDate(caseItem.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-cyan-400/80">Last Modified:</span>
                <span className="font-mono text-cyan-200">{formatDate(caseItem.updatedAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-cyan-400/80">Storage Location:</span>
                <span className="text-emerald-700 font-semibold font-mono">Dexie IndexedDB (Local Vault)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: FIELD TESTS */}
      {activeTab === 'tests' && (
        <div>
          {tests.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No Field Tests Recorded"
              description="No presumptive chemical or immunoassay tests have been documented for this case yet. The complete Field Testing suite activates in Stage 4."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((t) => (
                <Card key={t.id} className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-cyan-50">{t.testNumber}</span>
                    <Badge variant={t.resultStatus === 'PRESUMPTIVE_POSITIVE' ? 'warning' : 'success'}>
                      {t.resultStatus}
                    </Badge>
                  </div>
                  <p className="text-cyan-200 font-medium">{t.kitType}</p>
                  <p className="text-cyan-400/80">{t.presumptiveCategory}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    Logged: {formatDate(t.timestamp)} by {t.performedBy}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAMPLES */}
      {activeTab === 'samples' && (
        <div>
          {samples.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Physical Samples Registered"
              description="No physical forensic specimens have been cataloged for this case. Physical sample intake activates in subsequent stages."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {samples.map((s) => (
                <Card key={s.id} className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-brand-600">{s.sampleNumber}</span>
                    <Badge variant="primary">{s.custodyStatus}</Badge>
                  </div>
                  <p className="text-cyan-100 font-semibold">{s.description}</p>
                  <p className="text-cyan-400/80">Approx. {s.estimatedQuantity} {s.unit} ({s.physicalState})</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVIDENCE */}
      {activeTab === 'evidence' && (
        <div>
          {evidence.length === 0 ? (
            <EmptyState
              icon={Lock}
              title="No Sealed Evidence Logged"
              description="No tamper-evident security bags or barcode manifests have been linked to this case file."
            />
          ) : (
            <div className="space-y-3">
              {evidence.map((e) => (
                <Card key={e.id} className="p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-cyan-50">{e.evidenceTag}</span>
                    <Badge variant={e.sealed ? 'success' : 'danger'}>
                      {e.sealed ? `Sealed (${e.sealNumber})` : 'Unsealed'}
                    </Badge>
                  </div>
                  <p className="text-cyan-300">Storage: {e.storageLocation} • Barcode: {e.barcode}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Case Reports Compiled"
              description="No formalized forensic summaries or chain-of-custody export manifests have been generated for this case."
            />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Card key={r.id} className="p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-cyan-50">{r.reportNumber}</span>
                    <Badge variant="primary">{r.status}</Badge>
                  </div>
                  <h4 className="font-semibold text-cyan-100">{r.title}</h4>
                  <p className="text-cyan-300">{r.summary}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT HISTORY TIMELINE */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <CardTitle>Case Activity & Forensic Audit Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-cyan-400/80 italic text-center py-6">
                No specific activity logged yet for this case in the audit ledger.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-navy-900/40 backdrop-blur-md border-2 border-brand-600 ring-4 ring-white" />
                    <div className="bg-navy-950/60/80 rounded-xl p-3.5 border border-cyan-500/30 hover:border-cyan-400/40 transition-colors text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-50 text-xs bg-navy-900/40 backdrop-blur-md px-2 py-0.5 rounded border border-cyan-500/30">
                          {log.action}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-cyan-200 leading-relaxed font-medium">
                        {log.details || 'Operational record mutation executed.'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-cyan-500/30/60">
                        <span>Personnel: <strong className="text-cyan-300">{log.performedBy}</strong> ({log.userRole})</span>
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs">{log.integrityHash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Transition Modal */}
      {showTransitionModal && (
        <StatusTransitionModal
          caseItem={caseItem}
          userRole={user?.role}
          isOpen={showTransitionModal}
          onClose={() => setShowTransitionModal(false)}
          onTransition={handleStatusTransition}
        />
      )}
    </div>
  );
};
