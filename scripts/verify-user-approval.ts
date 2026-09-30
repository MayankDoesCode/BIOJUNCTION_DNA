import 'fake-indexeddb/auto';
import { authService } from '../src/services/authService';
import { db } from '../src/database';

// Mock storage
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

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

async function runTests() {
  console.log('\n======================================================');
  console.log('USER REGISTRATION & ADMIN APPROVAL WORKFLOW VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Initial State: Register new user
  console.log('1. User Registration Request Flow');
  const regResult = await authService.register({
    fullName: 'Dr. Julian Vance',
    username: 'julian.vance',
    email: 'julian.vance@forensics.state.gov',
    agency: 'State Narcotics Bureau',
    badgeNumber: 'SNB-9912',
    role: 'LAB_USER',
    password: 'SecurePassword2026!',
  });

  assert(regResult.success === true, 'Registration succeeds for valid applicant payload');
  assert(regResult.user?.active === false, 'New applicant user has active = false');
  assert(regResult.user?.approvalStatus === 'PENDING', 'New applicant approvalStatus is PENDING');

  // 2. Duplicate username check
  console.log('\n2. Duplicate Username Rejection');
  const dupResult = await authService.register({
    fullName: 'Duplicate Julian',
    username: 'julian.vance',
    email: 'other@forensics.state.gov',
    agency: 'Other Agency',
    badgeNumber: 'SNB-0000',
    role: 'FIELD_OFFICER',
    password: 'SecurePassword2026!',
  });
  assert(dupResult.success === false, 'Duplicate username is rejected');
  assert(dupResult.error?.includes('already registered') === true, 'Clear error message returned for duplicate username');

  // 3. Login Attempt by Pending User
  console.log('\n3. Login Blocking for Unapproved Applicant');
  const loginAttempt1 = await authService.login('julian.vance', 'SecurePassword2026!');
  assert(loginAttempt1.success === false, 'Pending user cannot log into terminal');
  assert(loginAttempt1.error?.toLowerCase().includes('pending') === true, 'Error indicates authorization is pending admin review');

  // 4. Admin Operator Listing
  console.log('\n4. Admin Operator Access Directory');
  const allUsers = await authService.getAllUsers();
  assert(allUsers.length >= 5, 'User directory includes seed operators and new applicant');
  const pendingApplicant = allUsers.find(u => u.username === 'julian.vance');
  assert(!!pendingApplicant, 'Applicant appears in admin directory');
  assert(pendingApplicant?.approvalStatus === 'PENDING', 'Applicant status is PENDING in directory');

  // 5. Admin Approval Flow
  console.log('\n5. Admin Access Authorization');
  if (pendingApplicant) {
    await authService.approveUser(pendingApplicant.id, 'LAB_USER');
  }

  const updatedUsers = await authService.getAllUsers();
  const approvedApplicant = updatedUsers.find(u => u.username === 'julian.vance');
  assert(approvedApplicant?.active === true, 'Approved user is now active = true');
  assert(approvedApplicant?.approvalStatus === 'APPROVED', 'Approved user approvalStatus is APPROVED');

  // 6. Authorized Login
  console.log('\n6. Authorized Terminal Login');
  const loginAttempt2 = await authService.login('julian.vance', 'SecurePassword2026!');
  assert(loginAttempt2.success === true, 'Approved user can now successfully log in');
  assert(loginAttempt2.user?.fullName === 'Dr. Julian Vance', 'Logged in user profile matches');

  // 7. Wrong Password Check
  console.log('\n7. Password Verification');
  const wrongPwLogin = await authService.login('julian.vance', 'WrongPassword123');
  assert(wrongPwLogin.success === false, 'Invalid password is rejected');

  // 8. Admin Suspend / Deactivate Operator
  console.log('\n8. Operator Suspension (Revocation)');
  if (pendingApplicant) {
    await authService.toggleUserActive(pendingApplicant.id, false);
  }
  const suspendedLogin = await authService.login('julian.vance', 'SecurePassword2026!');
  assert(suspendedLogin.success === false, 'Suspended operator is blocked from terminal');

  // 9. Admin Re-activate Operator
  console.log('\n9. Operator Reactivation');
  if (pendingApplicant) {
    await authService.toggleUserActive(pendingApplicant.id, true);
  }
  const reactivatedLogin = await authService.login('julian.vance', 'SecurePassword2026!');
  assert(reactivatedLogin.success === true, 'Reactivated operator can log in again');

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL USER APPROVAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
