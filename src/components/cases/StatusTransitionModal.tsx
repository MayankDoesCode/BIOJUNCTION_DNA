import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  getAllowedNextStatuses,
  CASE_STATUS_LABELS,
  CASE_STATUS_DESCRIPTIONS,
  CASE_STATUS_COLORS,
} from '../../utils/caseWorkflow';
import type { Case, CaseStatus, UserRole } from '../../types';

interface StatusTransitionModalProps {
  caseItem: Case;
  userRole?: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onTransition: (nextStatus: CaseStatus, transitionReason?: string) => Promise<void>;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  caseItem,
  userRole,
  isOpen,
  onClose,
  onTransition,
}) => {
  const allowedStatuses = getAllowedNextStatuses(caseItem.status, userRole);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(
    allowedStatuses.length > 0 ? allowedStatuses[0] : null
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      await onTransition(selectedStatus, reason.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-navy-900/40 backdrop-blur-md rounded-2xl shadow-2xl border border-cyan-500/30 max-w-lg w-full overflow-hidden text-cyan-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-950/60/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-cyan-50 text-sm">Update Case Status</h3>
              <p className="text-[11px] text-cyan-400/80 font-mono">{caseItem.caseNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-300 p-1 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Status State */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950/60 border border-cyan-500/30">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Current Status
              </span>
              <span className="font-semibold text-cyan-50 text-sm">
                {CASE_STATUS_LABELS[caseItem.status]}
              </span>
            </div>
            <Badge variant={CASE_STATUS_COLORS[caseItem.status]}>
              {caseItem.status}
            </Badge>
          </div>

          {/* Permitted Target Status Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-2">
              Select Permitted Next Status *
            </label>

            {allowedStatuses.length === 0 ? (
              <div className="p-4 rounded-xl bg-navy-950/60 border border-cyan-500/30 text-cyan-400/80 text-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                <p className="font-semibold text-cyan-200">No Authorized Transitions Available</p>
                <p className="text-[11px] mt-0.5">
                  This case is currently {caseItem.status}. Your operational role ({userRole}) does not have clearance to transition this status.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedStatuses.map((st) => (
                  <label
                    key={st}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedStatus === st
                        ? 'bg-brand-50/70 border-brand-300 ring-1 ring-brand-400'
                        : 'bg-navy-900/40 backdrop-blur-md border-cyan-500/30 hover:bg-navy-950/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="nextStatus"
                      value={st}
                      checked={selectedStatus === st}
                      onChange={() => setSelectedStatus(st)}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-50">{CASE_STATUS_LABELS[st]}</span>
                        <Badge variant={CASE_STATUS_COLORS[st]} size="sm">
                          {st}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-cyan-400/80 mt-1 leading-relaxed">
                        {CASE_STATUS_DESCRIPTIONS[st]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reason / Notes Field */}
          {allowedStatuses.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
                Transition Reason & Operational Notes
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document factual justification for status transition (e.g. initial screening completed, warrant executed)..."
                className="w-full px-3 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!selectedStatus || allowedStatuses.length === 0 || isSubmitting}
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Transition Status
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
