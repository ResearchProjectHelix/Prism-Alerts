import { useNavigate } from 'react-router-dom';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { hasSeenInstallInstructions } from './InstallInstructionsPage';
import { colors } from '../lib/colors';

export function SettingsPage() {
  const navigate = useNavigate();
  const { isSupported, permission, isSubscribed, isSubscribing, error, subscribe, unsubscribe } =
    usePushSubscription();

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
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
            {isSupported && !isSubscribed &&
              'Get notified on this device when a new lab result or scan is uploaded for one of your patients.'}
            {isSupported && isSubscribed &&
              "You'll be notified on this device when new results or scans are uploaded."}
          </p>

          {error && (
            <p style={{ fontSize: 12, color: colors.destructive, marginBottom: 12 }}>{error}</p>
          )}

          {isSupported && (
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isSubscribing}
              style={{
                borderRadius: 8,
                height: 42,
                border: isSubscribed ? `1px solid ${colors.border}` : 'none',
                backgroundColor: isSubscribed ? 'transparent' : colors.primary,
                color: isSubscribed ? colors.mutedForeground : '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '0 16px',
                cursor: isSubscribing ? 'default' : 'pointer',
                opacity: isSubscribing ? 0.7 : 1,
              }}
            >
              {isSubscribing ? 'Please wait\u2026' : isSubscribed ? 'Turn Off Notifications' : 'Enable Notifications'}
            </button>
          )}

          {permission === 'denied' && (
            <p style={{ fontSize: 12, color: colors.warning, marginTop: 10 }}>
              Notifications are blocked for this site in your browser settings \u2014 you'll need to
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
