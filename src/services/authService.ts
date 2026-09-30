/**
 * =========================================================================
 * DEMO AUTHENTICATION SERVICE (PROTOTYPE IMPLEMENTATION)
 * =========================================================================
 * NOTICE:
 * This is a frontend prototype authentication abstraction.
 * Passwords are NOT stored in IndexedDB or client-side storage.
 * Designed to be replaced with a production FastAPI OAuth2 / JWT backend
 * without altering downstream components.
 */

import { db } from '../database/db';
import { DEMO_USERS } from '../database/seedData';
import { sessionService } from './sessionService';
import { auditService } from './auditService';
import { apiService } from './apiService';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';
import type { User, UserRole, Permission, AuthSession, LoginCredentials } from '../types';

// Standard demo password across all simulated operator profiles
export const DEMO_STANDARD_PASSWORD = 'FieldTesting2026!';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export const authService = {
  /**
   * Retrieves all predefined test accounts for the demo login helper.
   */
  getAvailableDemoUsers(): User[] {
    return DEMO_USERS;
  },

  /**
   * Retrieves all users registered in the database.
   * Auto-populates DEMO_USERS if table is empty.
   */
  async getAllUsers(): Promise<User[]> {
    const existing = await db.users.toArray();
    const existingIds = new Set(existing.map((u) => u.id));
    const missingSeed = DEMO_USERS.filter((u) => !existingIds.has(u.id));
    if (missingSeed.length > 0) {
      await db.users.bulkAdd(missingSeed);
      return [...existing, ...missingSeed];
    }
    return existing;
  },

  /**
   * Submits a new user access request.
   * New users are created with active: false (pending admin review).
   */
  async register(userData: {
    fullName: string;
    username: string;
    email: string;
    agency: string;
    badgeNumber: string;
    role: UserRole;
    password?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check if user already exists in db.users or DEMO_USERS
    const existingInDb = await db.users
      .filter((u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)
      .first();

    const existingInDemo = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );

    if (existingInDb || existingInDemo) {
      return {
        success: false,
        error: 'An account with this username or email address is already registered.',
      };
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: userData.fullName.trim(),
      username: userData.username.trim(),
      email: userData.email.trim(),
      agency: userData.agency.trim() || 'Forensic Agency',
      badgeNumber: userData.badgeNumber.trim() || `REQ-${Date.now().toString().slice(-4)}`,
      role: userData.role,
      active: false, // Locked until Admin grants access!
      approvalStatus: 'PENDING',
      password: userData.password || DEMO_STANDARD_PASSWORD,
      createdAt: new Date().toISOString(),
    };

    await db.users.add(newUser);

    // Record audit event for administrative visibility
    await auditService.record(
      'USER_REGISTRATION_REQUESTED',
      'USER',
      newUser.id,
      `New operator access request submitted for ${newUser.fullName} (${newUser.username}) - Awaiting Admin approval`
    );

    return {
      success: true,
      user: newUser,
    };
  },

  /**
   * Approves a pending user access request (Admin only).
   */
  async approveUser(userId: string, assignedRole?: UserRole): Promise<void> {
    const user = await db.users.get(userId);
    if (!user) {
      throw new Error('User record not found');
    }

    const updates: Partial<User> = {
      active: true,
      approvalStatus: 'APPROVED',
    };
    if (assignedRole) {
      updates.role = assignedRole;
    }

    await db.users.update(userId, updates);

    await auditService.record(
      'USER_ACCESS_APPROVED',
      'USER',
      user.id,
      `Operator account approved & activated: ${user.fullName} (${user.username})`
    );
  },

  /**
   * Denies / Revokes user access (Admin only).
   */
  async rejectUser(userId: string): Promise<void> {
    const user = await db.users.get(userId);
    if (!user) {
      throw new Error('User record not found');
    }

    await db.users.update(userId, {
      active: false,
      approvalStatus: 'REJECTED',
    });

    await auditService.record(
      'USER_ACCESS_REVOKED',
      'USER',
      user.id,
      `Operator access denied/deactivated: ${user.fullName} (${user.username})`
    );
  },

  /**
   * Toggles active status of an operator account.
   */
  async toggleUserActive(userId: string, active: boolean): Promise<void> {
    await db.users.update(userId, { active, approvalStatus: active ? 'APPROVED' : 'REJECTED' });
  },

  /**
   * Deletes an operator account record.
   */
  async deleteUser(userId: string): Promise<void> {
    await db.users.delete(userId);
  },

  /**
   * Safe authentication routine.
   * Checks database users and verifies approval status and password signature.
   */
  async login(
    credentialsOrIdentifier: LoginCredentials | string,
    passwordArg?: string,
    rememberMeArg?: boolean
  ): Promise<AuthResult> {
    let identifier: string;
    let password = '';
    let rememberMe = false;

    if (typeof credentialsOrIdentifier === 'string') {
      identifier = credentialsOrIdentifier;
      password = passwordArg || '';
      rememberMe = !!rememberMeArg;
    } else {
      identifier = credentialsOrIdentifier?.identifier || '';
      password = credentialsOrIdentifier?.password || '';
      rememberMe = !!credentialsOrIdentifier?.rememberMe;
    }

    const cleanId = (identifier || '').trim().toLowerCase();

    // Simulated network delay (200ms) for realistic UX and loading states
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 1. Look up in local IndexedDB users table
    let targetUser = await db.users
      .filter((u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId)
      .first();

    // 2. Fallback to predefined demo seed users if not yet copied to db
    if (!targetUser) {
      targetUser = DEMO_USERS.find(
        (u) =>
          u.username.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId
      );
    }

    if (!targetUser) {
      await auditService.recordAuthEvent({
        action: 'LOGIN_FAILED',
        details: 'Failed authentication attempt: Unknown operator identifier',
        metadata: { identifierAttempted: cleanId },
      });
      return {
        success: false,
        error: 'Invalid credentials. User identifier was not recognized in authorized registry.',
      };
    }

    // Check if user is approved and active
    if (!targetUser.active) {
      await auditService.recordAuthEvent({
        action: 'LOGIN_FAILED',
        userId: targetUser.id,
        performedBy: targetUser.fullName,
        userRole: targetUser.role,
        details: 'Failed authentication attempt: Operator account is pending administrator approval',
      });

      if (targetUser.approvalStatus === 'REJECTED') {
        return {
          success: false,
          error: 'Access Denied: Your account request was rejected or suspended by an Administrator.',
        };
      }

      return {
        success: false,
        error: 'Access Pending: Your registration is awaiting Administrator approval before terminal access is granted.',
      };
    }

    // Verify password (custom password if provided or DEMO_STANDARD_PASSWORD)
    const expectedPassword = targetUser.password || DEMO_STANDARD_PASSWORD;
    if (password !== expectedPassword && password !== DEMO_STANDARD_PASSWORD) {
      await auditService.recordAuthEvent({
        action: 'LOGIN_FAILED',
        userId: targetUser.id,
        performedBy: targetUser.fullName,
        userRole: targetUser.role,
        details: 'Failed authentication attempt: Incorrect password signature',
      });
      return {
        success: false,
        error: 'Invalid password signature. Please check your credentials.',
      };
    }

    // Generate safe session token
    const session = sessionService.createSession(targetUser, rememberMe);
    sessionService.saveSession(session);
    apiService.setAuthToken(session.token);

    // Audit log successful authentication
    await auditService.recordAuthEvent({
      action: 'LOGIN_SUCCESS',
      userId: targetUser.id,
      performedBy: targetUser.fullName,
      userRole: targetUser.role,
      details: `Operator authenticated via terminal (Badge: ${targetUser.badgeNumber})`,
      metadata: {
        agency: targetUser.agency,
        rememberMe,
      },
    });

    return {
      success: true,
      user: targetUser,
      session,
    };
  },

  /**
   * Restores an existing session from local/session storage upon application launch.
   */
  async restoreSession(): Promise<{ session: AuthSession | null; isExpired: boolean }> {
    const { session, isExpired } = sessionService.loadSession();

    if (isExpired) {
      await auditService.recordAuthEvent({
        action: 'SESSION_EXPIRED',
        details: 'Terminal session expired due to timeout threshold.',
      });
      apiService.setAuthToken(null);
      return { session: null, isExpired: true };
    }

    if (session) {
      apiService.setAuthToken(session.token);
    }

    return { session, isExpired: false };
  },

  /**
   * Logs out the user, clearing session storage and logging the event.
   */
  async logout(user: User | null, reason: string = 'USER_INITIATED'): Promise<void> {
    if (user) {
      await auditService.recordAuthEvent({
        action: 'LOGOUT',
        userId: user.id,
        performedBy: user.fullName,
        userRole: user.role,
        details: `Operator logged out (${reason})`,
      });
    }

    sessionService.clearSession();
    apiService.setAuthToken(null);
  },

  /**
   * Centralized permission checking wrapper.
   */
  hasPermission(user: User | null | undefined, permission: Permission): boolean {
    if (!user) return false;
    return hasPermission(user.role, permission);
  },

  hasAnyPermission(user: User | null | undefined, permissions: Permission[]): boolean {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  },

  hasAllPermissions(user: User | null | undefined, permissions: Permission[]): boolean {
    if (!user) return false;
    return hasAllPermissions(user.role, permissions);
  },

  hasRole(user: User | null | undefined, roles: UserRole | UserRole[]): boolean {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },
};
