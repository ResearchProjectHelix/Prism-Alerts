import { useNavigate } from 'react-router-dom';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { hasSeenInstallInstructions } from './InstallInstructionsPage';
import { colors } from '../lib/colors';

export function SettingsPage() {
  const navigate = useNavigate();
  const { isSupported, permission, isSubscribed, hasBrowserSubscription, isChecking, isSubscribing, registrationError, error, subscribe, unsubscribe, refresh } =
    usePushSubscription();
  const needsReset = hasBrowserSubscription && !isSubscribed;
  const busy = isChecking || isSubscribing;

  return (
    <div className="connect-page" style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header className="connect-header" style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate('/alerts')}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, padding: 0, cursor: 'pointer' }}
        >
          &larr; Alerts
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Settings</div>
      </header>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Push Notifications</div>
          <p style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 1.5, marginBottom: 14 }}>
            {!isSupported &&
              "This browser doesn't support push notifications. If you're on iPhone, install the app to your home screen first."}
            {isSupported && !isSubscribed && !needsReset &&
              'Register this browser for notifications for your account.'}
            {isSupported && needsReset &&
              'This browser has a subscription that is not registered for this account. Reset it before enabling notifications for this account.'}
            {isSupported && isSubscribed &&
              'This browser is registered for your account. Push delivery is still being validated for this research system.'}
          </p>

          {error && (
            <p style={{ fontSize: 12, color: colors.destructive, marginBottom: 12 }}>{error}</p>
          )}

          {isSupported && (
            <button
              onClick={registrationError ? () => void refresh() : isSubscribed || needsReset ? unsubscribe : subscribe}
              disabled={busy}
              style={{
                borderRadius: 8,
                height: 44,
                border: isSubscribed ? `1px solid ${colors.border}` : 'none',
                backgroundColor: isSubscribed ? 'transparent' : colors.primary,
                color: isSubscribed ? colors.mutedForeground : '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '0 16px',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Please wait…' : registrationError ? 'Check registration again' : needsReset ? 'Reset browser registration' : isSubscribed ? 'Turn Off Notifications' : 'Enable Notifications'}
            </button>
          )}

          {permission === 'denied' && (
            <p style={{ fontSize: 12, color: colors.warning, marginTop: 10 }}>
              Notifications are blocked for this site in your browser settings; you'll need to
              allow them there before this will work.
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/install')}
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: '16px 18px',
            textAlign: 'left',
            color: colors.foreground,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {hasSeenInstallInstructions() ? 'View install instructions again' : 'Install this app'} &rarr;
        </button>
      </div>
    </div>
  );
}
