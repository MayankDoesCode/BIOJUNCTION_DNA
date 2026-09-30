import type { CaseStatus, CasePriority, UserRole } from '../types';
import type { BadgeVariant } from '../components/common/Badge';

/**
 * Standard Forensic Case Status Progression Sequence
 */
export const CASE_WORKFLOW_STEPS: readonly CaseStatus[] = [
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'SAMPLE_COLLECTED',
  'TEST_COMPLETED',
  'UNDER_REVIEW',
  'CLOSED',
] as const;

/**
 * Permitted status transitions map.
 * Enforces predictable procedural compliance across field investigations.
 */
export const CASE_TRANSITION_GRAPH: Record<CaseStatus, readonly CaseStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'DRAFT', 'CANCELLED'],
  IN_PROGRESS: ['SAMPLE_COLLECTED', 'OPEN', 'CANCELLED'],
  SAMPLE_COLLECTED: ['TEST_COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
  TEST_COMPLETED: ['UNDER_REVIEW', 'SAMPLE_COLLECTED', 'CANCELLED'],
  UNDER_REVIEW: ['CLOSED', 'IN_PROGRESS', 'CANCELLED'],
  CLOSED: ['UNDER_REVIEW'], // Only privileged supervisors/admins can reopen closed cases
  CANCELLED: ['DRAFT', 'OPEN'], // Only supervisors/admins can restore cancelled cases
};

/**
 * Determines whether a transition from currentStatus to nextStatus is valid
 * and whether the operator's role possesses clearance for this transition.
 */
export function canTransitionCaseStatus(
  currentStatus: CaseStatus,
  nextStatus: CaseStatus,
  userRole?: UserRole
): boolean {
  if (currentStatus === nextStatus) return true;

  const allowedTargets = CASE_TRANSITION_GRAPH[currentStatus] || [];
  if (!allowedTargets.includes(nextStatus)) {
    return false;
  }

  // If no userRole is provided, return whether the structural transition is allowed
  if (!userRole) return true;

  // Role clearance checks for specific sensitive transitions
  if (nextStatus === 'CLOSED') {
    // Closing an official case requires supervisor or administrator sign-off
    return userRole === 'ADMIN' || userRole === 'SUPERVISOR';
  }

  if (currentStatus === 'CLOSED' && nextStatus === 'UNDER_REVIEW') {
    // Reopening an archived/closed case requires supervisor or admin
    return userRole === 'ADMIN' || userRole === 'SUPERVISOR';
  }

  if (currentStatus === 'CANCELLED') {
    // Restoring cancelled incident requires supervisor or admin
    return userRole === 'ADMIN' || userRole === 'SUPERVISOR';
  }

  if (userRole === 'VIEWER') {
    // Viewers cannot execute any status transitions
    return false;
  }

  return true;
}

/**
 * Returns the list of permitted next statuses for an active case.
 */
export function getAllowedNextStatuses(
  currentStatus: CaseStatus,
  userRole?: UserRole
): CaseStatus[] {
  const possibleTargets = CASE_TRANSITION_GRAPH[currentStatus] || [];
  return possibleTargets.filter((target) =>
    canTransitionCaseStatus(currentStatus, target, userRole)
  );
}

/**
 * Human-readable display titles for case statuses.
 */
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: 'Draft Record',
  OPEN: 'Open / Dispatched',
  IN_PROGRESS: 'Investigation In Progress',
  SAMPLE_COLLECTED: 'Sample(s) Collected',
  TEST_COMPLETED: 'Field Test Completed',
  UNDER_REVIEW: 'Under Supervisory Review',
  CLOSED: 'Closed & Archival Ready',
  CANCELLED: 'Cancelled / Voided',
};

/**
 * Procedural descriptions for status tooltips and audit context.
 */
export const CASE_STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  DRAFT: 'Initial intake details populated locally before formal incident dispatch.',
  OPEN: 'Incident officially registered and assigned to field investigation unit.',
  IN_PROGRESS: 'Field operatives on scene conducting search or manifest verification.',
  SAMPLE_COLLECTED: 'Physical specimens cataloged and secured in evidence pouches.',
  TEST_COMPLETED: 'Presumptive colorimetric or immunoassay tests administered and documented.',
  UNDER_REVIEW: 'Case awaiting supervisory validation, result verification, or report sign-off.',
  CLOSED: 'All investigative procedures concluded and chain of custody secured.',
  CANCELLED: 'Case voided or aborted due to operational cancellation or administrative void.',
};

/**
 * Consistent status badge color variants.
 */
export const CASE_STATUS_COLORS: Record<CaseStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  OPEN: 'primary',
  IN_PROGRESS: 'primary',
  SAMPLE_COLLECTED: 'warning',
  TEST_COMPLETED: 'warning',
  UNDER_REVIEW: 'warning',
  CLOSED: 'success',
  CANCELLED: 'danger',
};

/**
 * Priority badge color variants.
 */
export const CASE_PRIORITY_COLORS: Record<CasePriority, BadgeVariant> = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

/**
 * Returns badge variant for a case status.
 */
export function getStatusBadgeVariant(status: CaseStatus): BadgeVariant {
  return CASE_STATUS_COLORS[status] || 'default';
}
