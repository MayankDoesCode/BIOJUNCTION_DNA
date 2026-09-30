import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ShieldAlert, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { LocationInput } from '../components/cases/LocationInput';
import { caseRepository } from '../database/repositories/caseRepository';
import { syncRepository } from '../database/repositories/syncRepository';
import { auditService } from '../services/auditService';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  canTransitionCaseStatus,
  CASE_STATUS_LABELS,
} from '../utils/caseWorkflow';
import type { Case, CasePriority, CaseStatus, CaseLocation, User } from '../types';

export const CaseEditPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [officers, setOfficers] = useState<User[]>([]);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: CasePriority;
    status: CaseStatus;
    location: CaseLocation;
    assignedOfficer: string;
    notes: string;
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    location: { address: '', latitude: undefined, longitude: undefined },
    assignedOfficer: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      if (!caseId) return;
      try {
        const found = await caseRepository.getById(caseId);
        if (found) {
          setCaseItem(found);
          const locObj = typeof found.location === 'object'
            ? found.location
            : { address: found.location || '', latitude: undefined, longitude: undefined };

          setFormData({
            title: found.title,
            description: found.description || '',
            priority: found.priority,
            status: found.status,
            location: locObj,
            assignedOfficer: found.assignedOfficer || found.leadOfficerName || '',
            notes: found.notes || '',
          });
        }
        setOfficers(authService.getAvailableDemoUsers());
      } catch (err) {
        console.error('Failed to load case for editing:', err);
        showToast('Error loading case for editing', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [caseId]);

  if (isLoading) {
    return <LoadingSpinner label="Loading case file for editing..." className="h-80" />;
  }

  if (!caseItem) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Case Not Found"
        description="The requested case record does not exist or has been removed."
        actionLabel="Return to Cases"
        onAction={() => navigate('/cases')}
      />
    );
  }

  const canAssign = hasPermission('CASE_ASSIGN');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required and cannot be empty.';
    }
    if (!formData.location.address?.trim()) {
      errs.address = 'Scene address / location description is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user || !caseItem) return;

    // Check status transition validity if status changed
    if (formData.status !== caseItem.status) {
      if (!canTransitionCaseStatus(caseItem.status, formData.status, user.role)) {
        showToast(
          `Unauthorized transition from ${caseItem.status} to ${formData.status}`,
          'error'
        );
        return;
      }
    }

    // Check if anything actually changed
    const titleChanged = formData.title.trim() !== caseItem.title;
    const descChanged = (formData.description.trim() || undefined) !== caseItem.description;
    const priorityChanged = formData.priority !== caseItem.priority;
    const statusChanged = formData.status !== caseItem.status;
    const officerChanged = formData.assignedOfficer.trim() !== (caseItem.assignedOfficer || caseItem.leadOfficerName || '');
    const notesChanged = (formData.notes.trim() || undefined) !== caseItem.notes;
    const oldLoc = typeof caseItem.location === 'object' ? caseItem.location : { address: caseItem.location };
    const locationChanged =
      formData.location.address !== oldLoc.address ||
      formData.location.latitude !== oldLoc.latitude ||
      formData.location.longitude !== oldLoc.longitude;

    const hasAnyChange =
      titleChanged ||
      descChanged ||
      priorityChanged ||
      statusChanged ||
      officerChanged ||
      notesChanged ||
      locationChanged;

    if (!hasAnyChange) {
      showToast('No modifications detected. Case file remains unchanged.', 'info');
      navigate(`/cases/${caseItem.id}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Case> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        assignedOfficer: formData.assignedOfficer.trim() || caseItem.assignedOfficer,
        location: formData.location,
        notes: formData.notes.trim() || undefined,
      };

      await caseRepository.updateCase(caseItem.id, updates);

      // Audit specific changes without duplicating records
      if (statusChanged) {
        await auditService.record(
          'STATUS_CHANGED',
          'Case',
          caseItem.id,
          `Status changed from ${caseItem.status} to ${formData.status}`,
          user
        );
      }

      if (priorityChanged) {
        await auditService.record(
          'PRIORITY_CHANGED',
          'Case',
          caseItem.id,
          `Priority changed from ${caseItem.priority} to ${formData.priority}`,
          user
        );
      }

      if (officerChanged) {
        await auditService.record(
          'CASE_ASSIGNED',
          'Case',
          caseItem.id,
          `Investigating officer reassigned to ${formData.assignedOfficer}`,
          user
        );
      }

      if (titleChanged || descChanged || locationChanged || notesChanged) {
        await auditService.record(
          'CASE_UPDATED',
          'Case',
          caseItem.id,
          `Case file details and metadata updated`,
          user
        );
      }

      // Enqueue sync record
      await syncRepository.enqueue({
        entityType: 'cases',
        entityId: caseItem.id,
        action: 'UPDATE',
        payload: JSON.stringify(updates),
      });

      showToast(`Case ${caseItem.caseNumber} updated successfully`, 'success');
      navigate(`/cases/${caseItem.id}`);
    } catch (err) {
      console.error('Failed to update case:', err);
      showToast('Error saving changes to local database', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-cyan-400/80 mb-2">
        <button
          onClick={() => navigate(`/cases/${caseItem.id}`)}
          className="hover:text-cyan-100 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel and Return to Case Dossier
        </button>
      </div>

      <PageHeader
        title={`Edit Case File: ${caseItem.caseNumber}`}
        subtitle="Modify operational metadata, field scene coordinates, priority, and officer assignments"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Case Information & Operational Clearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-xs">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Incident / Case Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.title ? 'border-rose-300 ring-1 ring-rose-300' : 'border-cyan-400/40'
                }`}
              />
              {errors.title && <span className="text-[11px] text-rose-600 mt-1 block">{errors.title}</span>}
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Investigation Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CaseStatus })}
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={caseItem.status}>
                    Current: {CASE_STATUS_LABELS[caseItem.status]}
                  </option>
                  {(
                    [
                      'DRAFT',
                      'OPEN',
                      'IN_PROGRESS',
                      'SAMPLE_COLLECTED',
                      'TEST_COMPLETED',
                      'UNDER_REVIEW',
                      'CLOSED',
                      'CANCELLED',
                    ] as CaseStatus[]
                  ).map((st) => {
                    const isValid = canTransitionCaseStatus(caseItem.status, st, user?.role);
                    if (st === caseItem.status) return null;
                    return (
                      <option key={st} value={st} disabled={!isValid}>
                        {st} {!isValid ? '(Unauthorized Transition)' : ''}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Transitions adhere to standard forensic procedural sequences.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Priority Clearance Level *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as CasePriority })}
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="LOW">Low (Routine verification)</option>
                  <option value="MEDIUM">Medium (Standard field screening)</option>
                  <option value="HIGH">High (Active interdiction)</option>
                  <option value="CRITICAL">Critical (Urgent expedited forensic analysis)</option>
                </select>
              </div>
            </div>

            {/* Officer Assignment */}
            <div className="bg-navy-950/60 p-4 rounded-xl border border-cyan-500/30 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-200">
                Assigned Investigating Officer
              </label>
              {canAssign ? (
                <div>
                  <select
                    value={formData.assignedOfficer}
                    onChange={(e) => setFormData({ ...formData, assignedOfficer: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-sm text-cyan-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {officers.map((off) => (
                      <option key={off.id} value={off.fullName}>
                        {off.fullName} ({off.role} • Badge: {off.badgeNumber})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-cyan-400/80 mt-1 block">
                    You hold CASE_ASSIGN supervisory clearance to reallocate investigating personnel.
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-navy-900/40 backdrop-blur-md p-3 rounded-lg border border-cyan-500/30">
                  <span className="font-semibold text-cyan-100">{formData.assignedOfficer || 'Specialist J. Miller'}</span>
                  <span className="text-[11px] text-slate-400 italic">
                    Requires supervisory clearance to reassign
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Factual Field Observations & Incident Summary
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Document factual visual observations, circumstances of encounter..."
                className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Reusable Location Section */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-semibold text-cyan-100 text-xs uppercase tracking-wider mb-2">
                Geographic Scene Location
              </h3>
              <LocationInput
                value={formData.location}
                onChange={(loc) => setFormData({ ...formData, location: loc })}
                error={errors.address}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Operational Notes / Instructions
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add internal notes or instructions for subsequent laboratory splits..."
                className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Audit Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                All submitted modifications generate immutable audit entries containing your badge signature and exact field diffs.
              </span>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Case Modifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
