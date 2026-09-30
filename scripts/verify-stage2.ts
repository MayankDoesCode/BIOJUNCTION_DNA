import 'fake-indexeddb/auto';
import { DEMO_USERS } from '../src/database/seedData';
import { authService, DEMO_STANDARD_PASSWORD } from '../src/services/authService';
import { sessionService, SESSION_TIMEOUT_MS } from '../src/services/sessionService';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../src/utils/permissions';
import type { Permission, UserRole, User } from '../src/types';

// Mock storage for Node test runner
const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

// @ts-ignore
global.sessionStorage = {
  getItem: (key: string) => mockSessionStorage[key] || null,
  setItem: (key: string, val: string) => { mockSessionStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockSessionStorage[key]; },
  clear: () => { for (const k in mockSessionStorage) delete mockSessionStorage[k]; },
  key: () => null,
  length: 0,
};

// @ts-ignore
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; },
  key: () => null,
  length: 0,
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('STAGE 2 AUTOMATED TEST SUITE: AUTH & ROLE MANAGEMENT');
  console.log('======================================================\n');

  // Test 1: Verify all 5 Demo Users Exist
  console.log('[Test Suite 1: Demo Users Verification]');
  const expectedRoles: UserRole[] = ['ADMIN', 'FIELD_OFFICER', 'SUPERVISOR', 'LAB_USER', 'VIEWER'];
  for (const role of expectedRoles) {
    const user = DEMO_USERS.find((u) => u.role === role);
    assert(!!user, `Demo account configured for role: ${role} (${user?.username})`);
  }

  // Test 2: Successful Login for each Demo Role
  console.log('\n[Test Suite 2: Login Flow for Each Role]');
  for (const role of expectedRoles) {
    const demoUser = DEMO_USERS.find((u) => u.role === role)!;
    const result = await authService.login({
      identifier: demoUser.username,
      password: DEMO_STANDARD_PASSWORD,
      rememberMe: false,
    });
    assert(result.success === true, `Login successful for ${role} (${demoUser.username})`);
    assert(!!result.session?.token, `Token generated for ${role}`);
    assert(result.session?.user.role === role, `Session preserves role: ${role}`);
  }

  // Test 3: Login Failures & Safety
  console.log('\n[Test Suite 3: Login Security & Failure Handling]');
  const invalidPasswordResult = await authService.login({
    identifier: 'admin.reyes',
    password: 'WrongPassword123!',
  });
  assert(invalidPasswordResult.success === false, 'Rejects invalid password attempt');
  assert(
    invalidPasswordResult.error?.includes('Invalid password') === true,
    'Returns sanitized error message without leaking sensitive information'
  );

  const unknownUserResult = await authService.login({
    identifier: 'unknown.intruder@external.com',
    password: 'SomePassword',
  });
  assert(unknownUserResult.success === false, 'Rejects unrecognized operator identifier');

  // Test 4: Session Handling, Restoration, & Timeout
  console.log('\n[Test Suite 4: Session Abstraction & Expiration]');
  const testOfficer = DEMO_USERS.find((u) => u.role === 'FIELD_OFFICER')!;
  const newSession = sessionService.createSession(testOfficer, true);
  sessionService.saveSession(newSession);

  const loaded = sessionService.loadSession();
  assert(loaded.session !== null, 'Restores active session from persistent store');
  assert(loaded.session?.user.id === testOfficer.id, 'Restored session matches authenticated user');
  assert(loaded.isExpired === false, 'Active session is not flagged as expired');

  // Test session expiration logic
  const expiredSession = {
    ...newSession,
    expiresAt: new Date(Date.now() - 5000).toISOString(),
  };
  sessionService.saveSession(expiredSession);
  const expiredCheck = sessionService.loadSession();
  assert(expiredCheck.session === null, 'Expired session is automatically purged from storage');
  assert(expiredCheck.isExpired === true, 'Session expiration correctly detected');

  // Test 5: Role-Based Access Control (RBAC) Matrix
  console.log('\n[Test Suite 5: RBAC Permissions Matrix]');
  
  // ADMIN tests
  assert(hasPermission('ADMIN', 'CASE_CREATE'), 'ADMIN has CASE_CREATE');
  assert(hasPermission('ADMIN', 'SETTINGS_MANAGE'), 'ADMIN has SETTINGS_MANAGE');
  assert(hasPermission('ADMIN', 'AUDIT_VIEW'), 'ADMIN has AUDIT_VIEW');
  assert(hasAllPermissions('ADMIN', [...ROLE_PERMISSIONS.ADMIN]), 'ADMIN holds all operational permissions');

  // FIELD_OFFICER tests
  assert(hasPermission('FIELD_OFFICER', 'CASE_CREATE'), 'FIELD_OFFICER can create cases');
  assert(hasPermission('FIELD_OFFICER', 'FIELD_TEST_CREATE'), 'FIELD_OFFICER can conduct field tests');
  assert(hasPermission('FIELD_OFFICER', 'SAMPLE_CREATE'), 'FIELD_OFFICER can register samples');
  assert(!hasPermission('FIELD_OFFICER', 'SETTINGS_MANAGE'), 'FIELD_OFFICER CANNOT manage administrative settings');
  assert(!hasPermission('FIELD_OFFICER', 'AUDIT_VIEW'), 'FIELD_OFFICER CANNOT inspect audit ledger');

  // SUPERVISOR tests
  assert(hasPermission('SUPERVISOR', 'CASE_VIEW'), 'SUPERVISOR can view cases');
  assert(hasPermission('SUPERVISOR', 'REPORT_REVIEW'), 'SUPERVISOR can review/approve reports');
  assert(hasPermission('SUPERVISOR', 'AUDIT_VIEW'), 'SUPERVISOR can view audit log');
  assert(!hasPermission('SUPERVISOR', 'CASE_CREATE'), 'SUPERVISOR is not assigned field case intake');

  // LAB_USER tests
  assert(hasPermission('LAB_USER', 'SAMPLE_VIEW'), 'LAB_USER can view samples');
  assert(hasPermission('LAB_USER', 'FIELD_TEST_EDIT'), 'LAB_USER can enter/update lab results');
  assert(!hasPermission('LAB_USER', 'CASE_CREATE'), 'LAB_USER cannot create field cases');
  assert(!hasPermission('LAB_USER', 'SETTINGS_MANAGE'), 'LAB_USER cannot manage settings');

  // VIEWER tests
  assert(hasPermission('VIEWER', 'CASE_VIEW'), 'VIEWER can view cases');
  assert(hasPermission('VIEWER', 'REPORT_VIEW'), 'VIEWER can view reports');
  assert(!hasPermission('VIEWER', 'CASE_CREATE'), 'VIEWER cannot create cases');
  assert(!hasPermission('VIEWER', 'FIELD_TEST_CREATE'), 'VIEWER cannot create tests');
  assert(!hasPermission('VIEWER', 'SAMPLE_CREATE'), 'VIEWER cannot register samples');
  assert(!hasPermission('VIEWER', 'SETTINGS_MANAGE'), 'VIEWER cannot manage settings');

  // Test 6: Logout
  console.log('\n[Test Suite 6: Logout Lifecycle]');
  sessionService.saveSession(newSession);
  await authService.logout(testOfficer, 'USER_INITIATED');
  const sessionAfterLogout = sessionService.loadSession();
  assert(sessionAfterLogout.session === null, 'Logout securely wipes storage tokens');

  // Test 7: Audit Log Verification
  console.log('\n[Test Suite 7: Audit Trail Ingestion & Sanitization]');
  const { db } = await import('../src/database/db');
  const auditLogs = await db.auditLogs.toArray();
  
  const loginSuccessLog = auditLogs.find((l) => l.action === 'LOGIN_SUCCESS');
  assert(!!loginSuccessLog, 'LOGIN_SUCCESS event captured in immutable audit ledger');
  assert(loginSuccessLog?.performedBy === 'Commander R. Reyes' || !!loginSuccessLog?.userId, 'LOGIN_SUCCESS records operator credentials');

  const loginFailedLog = auditLogs.find((l) => l.action === 'LOGIN_FAILED');
  assert(!!loginFailedLog, 'LOGIN_FAILED event captured in audit ledger');
  assert(!JSON.stringify(loginFailedLog).includes('WrongPassword123!'), 'Plaintext passwords are NOT stored in audit log records');

  const logoutLog = auditLogs.find((l) => l.action === 'LOGOUT');
  assert(!!logoutLog, 'LOGOUT event captured in audit ledger');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
