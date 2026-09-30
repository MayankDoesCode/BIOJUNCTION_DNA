import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ShieldAlert,
  FileText,
  MapPin,
  UserCheck,
  StickyNote,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LocationInput } from '../components/cases/LocationInput';
import { caseRepository } from '../database/repositories/caseRepository';
import { syncRepository } from '../database/repositories/syncRepository';
import { auditService } from '../services/auditService';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { Case, CaseLocation, CasePriority, CaseStatus } from '../types';

export const CaseNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const currentUser = user || {
    id: 'usr_anon',
    fullName: 'Field Personnel',
    badgeNumber: 'N/A',
    agency: 'Forensic Operations',
    role: 'FIELD_OFFICER' as const,
  };

  const canAssignOfficers = authService.hasPermission(user, 'CASE_ASSIGN');
  const availableOfficers = authService.getAvailableDemoUsers();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNumber, setIsLoadingNumber] = useState(true);

  // Form State
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CasePriority>('MEDIUM');
  const [status, setStatus] = useState<CaseStatus>('OPEN');
  const [location, setLocation] = useState<CaseLocation>({ address: '' });
  const [createdBy] = useState<string>(currentUser.fullName);
  const [assignedOfficer, setAssignedOfficer] = useState<string>(currentUser.fullName);
  const [notes, setNotes] = useState('');

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate next case number on mount
  useEffect(() => {
    let mounted = true;
    const fetchNextCaseNumber = async () => {
      try {
        const nextNum = await caseRepository.generateNextCaseNumber();
        if (mounted) {
          setCaseNumber(nextNum);
          setIsLoadingNumber(false);
        }
      } catch (err) {
        console.error('Failed to generate next case number', err);
        if (mounted) {
          const fallback = `FT-${new Date().getFullYear()}-0001`;
          setCaseNumber(fallback);
          setIsLoadingNumber(false);
        }
      }
    };
    fetchNextCaseNumber();
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validate Case Number
    if (!caseNumber.trim()) {
      newErrors.caseNumber = 'Case number is required';
    } else {
      const existing = await caseRepository.getByCaseNumber(caseNumber.trim());
      if (existing) {
        newErrors.caseNumber = 'Case number already exists. Please generate or specify a unique identifier.';
      }
    }

    // Validate Title
    if (!title.trim()) {
      newErrors.title = 'Case title is required and cannot be empty.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Case title should be at least 5 characters for clarity.';
    }

    // Validate Priority
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priority)) {
      newErrors.priority = 'Valid priority level must be selected.';
    }

    // Validate Status
    if (!['DRAFT', 'OPEN'].includes(status)) {
      newErrors.status = 'New cases must be initiated as either DRAFT or OPEN.';
    }

    // Validate Created By
    if (!createdBy.trim()) {
      newErrors.createdBy = 'Authenticated creator must be recorded.';
    }

    // Validate Location
    if (!location.address || !location.address.trim()) {
      newErrors.location = 'Incident address or checkpoint location is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      showToast('Please correct validation errors before registering case', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const caseId = `case_${Date.now()}`;
      const now = new Date().toISOString();

      const newCase: Case = {
        id: caseId,
        caseNumber: caseNumber.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        location: {
          address: location.address?.trim() || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        createdBy,
        assignedOfficer: assignedOfficer.trim() || currentUser.fullName,
        createdAt: now,
        updatedAt: now,
        notes: notes.trim() || undefined,
        isArchived: false,
        leadOfficerId: currentUser.id,
        leadOfficerName: currentUser.fullName,
        agency: currentUser.agency,
      };

      // 1. Create in local Dexie IndexedDB
      await caseRepository.createCase(newCase);

      // 2. Audit Trail
      await auditService.record(
        'CASE_CREATED',
        'Case',
        caseId,
        `Created case ${newCase.caseNumber} ("${newCase.title}") with priority ${newCase.priority} assigned to ${newCase.assignedOfficer}`
      );

      // 3. Enqueue sync for backend
      await syncRepository.enqueue({
        entityType: 'cases',
        entityId: caseId,
        action: 'CREATE',
        payload: JSON.stringify(newCase),
      });

      showToast(`Case ${newCase.caseNumber} registered successfully`, 'success');
      navigate(`/cases/${caseId}`);
    } catch (err) {
      console.error('Failed to create case', err);
      showToast('Error registering case in local database. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Link */}
      <div className="flex items-center gap-2 text-xs text-cyan-400/80">
        <button
          onClick={() => navigate('/cases')}
          className="hover:text-cyan-100 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Case Records
        </button>
      </div>

      <PageHeader
        title="Open New Field Incident Case"
        subtitle="Initiate an official forensic chain-of-custody record for presumptive field drug testing"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A — CASE INFORMATION */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <CardTitle>Section A — Case Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Case Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Case Identifier *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => {
                      setCaseNumber(e.target.value);
                      if (errors.caseNumber) setErrors((prev) => ({ ...prev, caseNumber: '' }));
                    }}
                    placeholder={isLoadingNumber ? 'Generating next identifier...' : 'e.g. FT-2026-0001'}
                    disabled={isLoadingNumber}
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-100 font-mono focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.caseNumber ? 'border-rose-400 ring-1 ring-rose-400' : 'border-cyan-400/40'
                    }`}
                  />
                </div>
                {errors.caseNumber ? (
                  <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.caseNumber}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Sequential identifier automatically assigned for 2026 operational records
                  </span>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Operational Priority *
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as CasePriority);
                    if (errors.priority) setErrors((prev) => ({ ...prev, priority: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-100 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                    errors.priority ? 'border-rose-400 ring-1 ring-rose-400' : 'border-cyan-400/40'
                  }`}
                >
                  <option value="LOW">Low (Routine observation / Baseline check)</option>
                  <option value="MEDIUM">Medium (Standard field screening)</option>
                  <option value="HIGH">High (Active interdiction / Suspicious transport)</option>
                  <option value="CRITICAL">Critical (Immediate public hazard / Urgent assay)</option>
                </select>
                {errors.priority && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.priority}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Case Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g., Highway Patrol Checkpoint Alpha Interdiction"
                className={`w-full px-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                  errors.title ? 'border-rose-400 ring-1 ring-rose-400' : 'border-cyan-400/40'
                }`}
              />
              {errors.title && (
                <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.title}
                </span>
              )}
            </div>

            {/* Status & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Initial Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as CaseStatus);
                    if (errors.status) setErrors((prev) => ({ ...prev, status: '' }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-100 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="OPEN">OPEN (Active field deployment)</option>
                  <option value="DRAFT">DRAFT (Preliminary pending signoff)</option>
                </select>
                {errors.status && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.status}</span>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Incident Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Document initial incident conditions, encounter circumstances, vehicle or person observations..."
                  className="w-full px-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION B — LOCATION */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <CardTitle>Section B — Scene Location</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LocationInput
              value={location}
              onChange={(newLoc) => {
                setLocation(newLoc);
                if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
              }}
              error={errors.location}
            />
          </CardContent>
        </Card>

        {/* SECTION C — ASSIGNMENT */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <CardTitle>Section C — Personnel Assignment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Created By (Authenticated User, Read-only) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Created By (Originating Operator)
                </label>
                <div className="px-3.5 py-2.5 bg-navy-800/60 border border-cyan-500/30 rounded-lg text-sm font-medium text-cyan-100 flex items-center justify-between">
                  <span>{currentUser.fullName}</span>
                  <span className="text-[11px] text-cyan-400/80 font-mono">
                    Badge: {currentUser.badgeNumber || 'N/A'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Locked to active authenticated session for forensic auditability
                </span>
              </div>

              {/* Assigned Officer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                  Assigned Case Officer *
                </label>
                {canAssignOfficers ? (
                  <select
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-100 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {availableOfficers.map((u) => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role.replace('_', ' ')}) - {u.agency}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={assignedOfficer}
                      readOnly
                      disabled
                      className="w-full px-3.5 py-2.5 bg-navy-800/60 border border-cyan-500/30 rounded-lg text-sm font-medium text-cyan-200 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-amber-700 block">
                      Case reassignment requires Supervisor or Administrator permissions. Assigned to recording officer.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION D — NOTES */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-600" />
              <CardTitle>Section D — Field Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
              Internal Forensic Notes & Handling Directives
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter internal chain-of-custody notes, safety precautions, PPE considerations, or storage conditions..."
              className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </CardContent>
        </Card>

        {/* Security / Chain of Custody notice */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            Registering this case writes an immutable creation stamp in the local audit ledger. Case records remain encrypted and stored locally in Dexie IndexedDB for full offline utility.
          </span>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyan-500/30">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/cases')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || isLoadingNumber}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Register Case File
          </Button>
        </div>
      </form>
    </div>
  );
};
