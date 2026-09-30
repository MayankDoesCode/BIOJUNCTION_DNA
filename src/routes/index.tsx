import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CasesPage } from '../pages/CasesPage';
import { CaseNewPage } from '../pages/CaseNewPage';
import { CaseDetailsPage } from '../pages/CaseDetailsPage';
import { CaseEditPage } from '../pages/CaseEditPage';
import { FieldTestsPage } from '../pages/FieldTestsPage';
import { SamplesPage } from '../pages/SamplesPage';
import { EvidencePage } from '../pages/EvidencePage';
import { ReportsPage } from '../pages/ReportsPage';
import { SyncPage } from '../pages/SyncPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProteinsPage } from '../pages/ProteinsPage';
import { LigandsPage } from '../pages/LigandsPage';
import { DockingPage } from '../pages/DockingPage';
import { ResultsPage } from '../pages/ResultsPage';
import { ComparisonPage } from '../pages/ComparisonPage';
import { PrototypePage } from '../pages/PrototypePage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LandingPage } from '../pages/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/cases',
        element: (
          <ProtectedRoute requiredPermission="CASE_VIEW">
            <CasesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/cases/new',
        element: (
          <ProtectedRoute requiredPermission="CASE_CREATE">
            <CaseNewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/cases/:caseId',
        element: (
          <ProtectedRoute requiredPermission="CASE_VIEW">
            <CaseDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/cases/:caseId/edit',
        element: (
          <ProtectedRoute requiredPermission="CASE_EDIT">
            <CaseEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/field-tests',
        element: (
          <ProtectedRoute requiredPermission="FIELD_TEST_EDIT">
            <FieldTestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/samples',
        element: (
          <ProtectedRoute requiredPermission="SAMPLE_VIEW">
            <SamplesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/evidence',
        element: (
          <ProtectedRoute requiredPermission="CASE_VIEW">
            <EvidencePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute requiredPermission="REPORT_VIEW">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports/:jobId',
        element: (
          <ProtectedRoute requiredPermission="REPORT_VIEW">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/sync',
        element: <SyncPage />,
      },
      {
        path: '/audit-log',
        element: (
          <ProtectedRoute requiredPermission="AUDIT_VIEW">
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute requiredPermission="SETTINGS_MANAGE">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/proteins',
        element: <ProteinsPage />,
      },
      {
        path: '/ligands',
        element: <LigandsPage />,
      },
      {
        path: '/docking',
        element: <DockingPage />,
      },
      {
        path: '/results',
        element: <ResultsPage />,
      },
      {
        path: '/results/:jobId',
        element: <ResultsPage />,
      },
      {
        path: '/visualization',
        element: <ResultsPage />,
      },
      {
        path: '/visualization/:jobId',
        element: <ResultsPage />,
      },
      {
        path: '/comparison',
        element: <ComparisonPage />,
      },
      {
        path: '/prototype',
        element: <PrototypePage />,
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
