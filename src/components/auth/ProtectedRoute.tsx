import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auditService } from '../../services/auditService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { UnauthorizedPage } from '../../pages/UnauthorizedPage';
import type { Permission, UserRole } from '../../types';

interface ProtectedRouteProps {
  requiredPermission?: Permission;
  requiredRole?: UserRole | UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRole,
  children,
}) => {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  const isRoleAuthorized = requiredRole ? hasRole(requiredRole) : true;
  const isPermAuthorized = requiredPermission ? hasPermission(requiredPermission) : true;
  const isAuthorized = isRoleAuthorized && isPermAuthorized;

  // Log unauthorized access attempts
  useEffect(() => {
    if (isAuthenticated && user && !isAuthorized) {
      auditService.recordAuthEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        userId: user.id,
        performedBy: user.fullName,
        userRole: user.role,
        entityId: location.pathname,
        details: `Access denied to path: ${location.pathname}`,
        metadata: {
          path: location.pathname,
          requiredPermission,
          requiredRole,
        },
      });
    }
  }, [isAuthenticated, isAuthorized, location.pathname, requiredPermission, requiredRole, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <LoadingSpinner
          size="lg"
          label="Validating Field Terminal Credentials & Clearance..."
          className="text-white"
        />
        <span className="text-xs text-slate-400 mt-2 font-mono">
          Verifying session signatures against CJIS local vault
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <UnauthorizedPage requiredPermission={requiredPermission} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
