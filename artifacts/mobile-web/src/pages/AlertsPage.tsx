import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';

export function AlertsPage() {
  const { data: alerts, isLoading, error } = useAlerts();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (error instanceof Error && error.message === 'ACCOUNT_DEACTIVATED') {
    signOut();
    navigate('/login?deactivated=1', { replace: true });
    return null;
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>Alerts</div>
          <div style={{ fontSize: 12, color: colors.mutedForeground }}>
            {alerts ? `${alerts.length} open item${alerts.length === 1 ? '' : 's'}` : ' '}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/settings')} style={iconButtonStyle}>
            Settings
          </button>
          <button onClick={() => signOut()} style={iconButtonStyle}>
            Sign Out
          </button>
        </div>
      </header>

      {isLoading && <CenteredNote>Loading alerts\u2026</CenteredNote>}
      {error && !(error instanceof Error && error.message === 'ACCOUNT_DEACTIVATED') && (
        <CenteredNote isError>Couldn't load alerts. Pull to refresh or try again shortly.</CenteredNote>
      )}
      {alerts && alerts.length === 0 && (
        <CenteredNote>No open alerts \u2014 everything is up to date.</CenteredNote>
      )}

      {alerts && alerts.length > 0 && (
        <div>
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => navigate(`/patient/${alert.patientId}`)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderBottom: `1px solid ${colors.border}`,
                background: 'none',
                border: 'none',
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
                borderBottomColor: colors.border,
                textAlign: 'left',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: alert.priority === 'high' ? colors.destructive : colors.warning,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {alert.patientName}{' '}
                  <span style={{ color: colors.mutedForeground, fontWeight: 400 }}>{alert.mrn}</span>
                  {alert.isShared && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: colors.mutedForeground }}>
                      SHARED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                  {alert.ruleLabel} not completed
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CenteredNote({ children, isError }: { children: React.ReactNode; isError?: boolean }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: 'center',
        color: isError ? colors.destructive : colors.mutedForeground,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${colors.border}`,
  color: colors.mutedForeground,
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer',
};
