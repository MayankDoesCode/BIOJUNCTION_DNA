import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import { sessionService } from '../services/sessionService';
import type { User, UserRole, Permission, AuthSession, LoginCredentials } from '../types';

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permissions: Permission | Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage/sessionStorage on startup
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { session: restoredSession } = await authService.restoreSession();
        if (mounted && restoredSession) {
          setSession(restoredSession);
          setUser(restoredSession.user);
        }
      } catch (err) {
        console.error('[Auth] Failed to restore field session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Periodic expiration checker (every 30 seconds)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const { session: activeSession, isExpired } = sessionService.loadSession();
      if (isExpired || !activeSession) {
        logout('SESSION_EXPIRED');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success && result.session && result.user) {
        setSession(result.session);
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (reason: string = 'USER_INITIATED') => {
    setIsLoading(true);
    try {
      await authService.logout(user, reason);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkHasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      return authService.hasRole(user, roles);
    },
    [user]
  );

  const checkHasPermission = useCallback(
    (permissions: Permission | Permission[]) => {
      if (Array.isArray(permissions)) {
        return authService.hasAllPermissions(user, permissions);
      }
      return authService.hasPermission(user, permissions);
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    isLoading,
    login,
    logout,
    hasRole: checkHasRole,
    hasPermission: checkHasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
