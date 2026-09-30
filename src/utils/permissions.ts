import type { UserRole, Permission } from '../types';

/**
 * Role-Based Access Control (RBAC) Definition
 * Centralizes permission matrices across all five operational roles.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    'CASE_CREATE',
    'CASE_VIEW',
    'CASE_EDIT',
    'CASE_ASSIGN',
    'CASE_DELETE',
    'FIELD_TEST_CREATE',
    'FIELD_TEST_EDIT',
    'SAMPLE_CREATE',
    'SAMPLE_VIEW',
    'EVIDENCE_ADD',
    'REPORT_VIEW',
    'REPORT_REVIEW',
    'AUDIT_VIEW',
    'SETTINGS_MANAGE',
  ],
  FIELD_OFFICER: [
    'CASE_CREATE',
    'CASE_VIEW',
    'CASE_EDIT',
    'FIELD_TEST_CREATE',
    'FIELD_TEST_EDIT',
    'SAMPLE_CREATE',
    'SAMPLE_VIEW',
    'EVIDENCE_ADD',
    'REPORT_VIEW',
  ],
  SUPERVISOR: [
    'CASE_VIEW',
    'CASE_EDIT',
    'CASE_ASSIGN',
    'CASE_DELETE',
    'FIELD_TEST_EDIT',
    'SAMPLE_VIEW',
    'REPORT_VIEW',
    'REPORT_REVIEW',
    'AUDIT_VIEW',
  ],
  LAB_USER: [
    'CASE_VIEW',
    'SAMPLE_VIEW',
    'FIELD_TEST_CREATE',
    'FIELD_TEST_EDIT',
    'REPORT_VIEW',
  ],
  VIEWER: [
    'CASE_VIEW',
    'SAMPLE_VIEW',
    'REPORT_VIEW',
  ],
} as const;

/**
 * Checks whether a given role holds the specified permission.
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Checks whether a given role holds any of the specified permissions.
 */
export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Checks whether a given role holds all of the specified permissions.
 */
export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Human-readable descriptions for each permission.
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  CASE_CREATE: 'Create new field incident cases',
  CASE_VIEW: 'View incident cases and case files',
  CASE_EDIT: 'Modify case observations and metadata',
  CASE_ASSIGN: 'Assign field cases to designated investigating officers',
  CASE_DELETE: 'Archive or deactivate operational case files',
  FIELD_TEST_CREATE: 'Conduct and log presumptive field tests',
  FIELD_TEST_EDIT: 'Record/update test observations & results',
  SAMPLE_CREATE: 'Register new physical forensic specimens',
  SAMPLE_VIEW: 'Access sample registry and chain details',
  EVIDENCE_ADD: 'Catalog evidence bags and apply tamper seals',
  REPORT_VIEW: 'Access generated field reports and manifests',
  REPORT_REVIEW: 'Approve, finalize, and sign regulatory reports',
  AUDIT_VIEW: 'Inspect immutable forensic audit trail ledger',
  SETTINGS_MANAGE: 'Modify hardware terminal profiles and configurations',
};
