import type { AuthSession, User } from '../types';

/**
 * Session Management Foundation
 * Handles volatile/persisted session tokens without storing passwords or credentials.
 */

export const SESSION_TIMEOUT_MINUTES = 30;
export const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const SESSION_STORAGE_KEY = 'dc_field_auth_session';

export const sessionService = {
  /**
   * Generates a prototype session object with expiration timestamp.
   * Generates a safe simulated token format: header.payload.signature.
   */
  createSession(user: User, rememberMe: boolean = false): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS);
    
    // Abstract token structure mimicking an authenticated bearer JWT token
    const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const tokenPayload = btoa(
      JSON.stringify({
        sub: user.id,
        role: user.role,
        badge: user.badgeNumber,
        iat: Math.floor(now.getTime() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
      })
    );
    const tokenSignature = Math.random().toString(36).substring(2, 15);
    const token = `${tokenHeader}.${tokenPayload}.${tokenSignature}`;

    return {
      token,
      user,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      rememberMe,
    };
  },

  /**
   * Saves the session into either localStorage or sessionStorage depending on rememberMe preference.
   */
  saveSession(session: AuthSession): void {
    const data = JSON.stringify(session);
    if (session.rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, data);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, data);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  /**
   * Restores an active session from storage, validating expiration.
   * Cleans up expired sessions immediately.
   */
  loadSession(): { session: AuthSession | null; isExpired: boolean } {
    let raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(SESSION_STORAGE_KEY);
    }

    if (!raw) {
      return { session: null, isExpired: false };
    }

    try {
      const session = JSON.parse(raw) as AuthSession;
      const expiry = new Date(session.expiresAt).getTime();
      const now = Date.now();

      if (now >= expiry) {
        this.clearSession();
        return { session: null, isExpired: true };
      }

      return { session, isExpired: false };
    } catch {
      this.clearSession();
      return { session: null, isExpired: false };
    }
  },

  /**
   * Removes session state across both storages.
   */
  clearSession(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Refreshes the session expiration upon valid field activity.
   */
  refreshSession(currentSession: AuthSession): AuthSession {
    const now = new Date();
    const updated: AuthSession = {
      ...currentSession,
      expiresAt: new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString(),
    };
    this.saveSession(updated);
    return updated;
  },
};
