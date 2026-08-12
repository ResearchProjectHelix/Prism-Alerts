import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { hasSeenInstallInstructions, InstallInstructionsPage } from './pages/InstallInstructionsPage';
import { LoginPage } from './pages/LoginPage';
import { AlertsPage } from './pages/AlertsPage';
import { PatientOverviewPage } from './pages/PatientOverviewPage';
import { PatientResultsPage } from './pages/PatientResultsPage';
import { PatientScansPage } from './pages/PatientScansPage';
import { SettingsPage } from './pages/SettingsPage';
import { colors } from './lib/colors';
import { isRunningStandalone } from './lib/pwa';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          color: colors.mutedForeground,
        }}
      >
        Loading\u2026
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** First-ever visit (no session, never seen install instructions) lands here. */
function RootRedirect() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (session) return <Navigate to="/alerts" replace />;
  // Already running as an installed PWA — skip instructions entirely,
  // regardless of what localStorage says (see lib/pwa.ts for why).
  if (isRunningStandalone()) return <Navigate to="/login" replace />;
  if (!hasSeenInstallInstructions()) return <Navigate to="/install" replace />;
  return <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/install" element={<InstallInstructionsPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/alerts"
        element={
          <RequireAuth>
            <AlertsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/patient/:id"
        element={
          <RequireAuth>
            <PatientOverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/patient/:id/results"
        element={
          <RequireAuth>
            <PatientResultsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/patient/:id/scans"
        element={
          <RequireAuth>
            <PatientScansPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
