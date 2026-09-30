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
   * Safe mock authentication routine.
   * Matches identifier against known prototype users and verifies test password.
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { identifier, password, rememberMe = false } = credentials;
    const cleanId = identifier.trim().toLowerCase();

    // Simulated network delay (300ms) for realistic UX and loading states
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Find user by either username or email
    const targetUser = DEMO_USERS.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

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

    if (!targetUser.active) {
      await auditService.recordAuthEvent({
        action: 'LOGIN_FAILED',
        userId: targetUser.id,
        performedBy: targetUser.fullName,
        userRole: targetUser.role,
        details: 'Failed authentication attempt: Operator account is inactive/suspended',
      });
      return {
        success: false,
        error: 'Your field account is marked INACTIVE. Contact your agency supervisor.',
      };
    }

    // Verify demo password (never logged or saved in IndexedDB)
    if (password !== DEMO_STANDARD_PASSWORD) {
      await auditService.recordAuthEvent({
        action: 'LOGIN_FAILED',
        userId: targetUser.id,
        performedBy: targetUser.fullName,
        userRole: targetUser.role,
        details: 'Failed authentication attempt: Incorrect password signature',
      });
      return {
        success: false,
        error: 'Invalid password. Please verify your credentials or use prototype helper.',
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
