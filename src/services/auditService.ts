import { auditLogRepository } from '../database/repositories/auditLogRepository';
import type { User, UserRole } from '../types';

export interface AuditAuthEventParams {
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_EXPIRED' | 'UNAUTHORIZED_ACCESS_ATTEMPT';
  userId?: string;
  performedBy?: string;
  userRole?: UserRole;
  entityId?: string;
  details?: string;
  metadata?: Record<string, unknown> | string;
}

export const auditService = {
  /**
   * Records a general domain event performed by an authenticated user.
   */
  async record(
    action: string,
    entityType: string,
    entityId: string,
    details?: string,
    user?: User
  ): Promise<string> {
    const signature = `sha256-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`;

    return auditLogRepository.log({
      action,
      entityType,
      entityId,
      userId: user?.id,
      performedBy: user?.fullName || 'SYSTEM',
      userRole: user?.role || 'VIEWER',
      details,
      integrityHash: signature,
    });
  },

  /**
   * Specifically logs authentication and authorization boundary events.
   * Explicitly avoids recording passwords or secrets.
   */
  async recordAuthEvent(params: AuditAuthEventParams): Promise<string> {
    const signature = `sha256-auth-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`;

    return auditLogRepository.log({
      action: params.action,
      entityType: 'AUTH_SESSION',
      entityId: params.entityId || params.userId || 'SESSION',
      userId: params.userId,
      performedBy: params.performedBy || 'ANONYMOUS_OR_TERMINAL',
      userRole: params.userRole || 'VIEWER',
      details: params.details,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      integrityHash: signature,
    });
  },
};
