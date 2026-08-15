import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';

const SEEN_KEY = 'prism-alerts-install-seen';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/win|mac|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallInstructionsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const standalone = !!session; // reached from Settings while already logged in
  const [platform] = useState<Platform>(detectPlatform());
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleContinue = () => {
    localStorage.setItem(SEEN_KEY, '1');
    navigate(standalone ? '/settings' : '/login', { replace: true });
  };

  const handleInstallClick = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 28px 40px',
        color: colors.foreground,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <img
          src="/icons/icon.ico"
          alt="PRISM"
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            objectFit: 'cover',
          }}
        />
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>PRISM</div>
          <div style={{ color: colors.primary, fontSize: 11, fontWeight: 600, letterSpacing: 2 }}>
            ALERTS
          </div>
        </div>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Install PRISM Alerts on this device
      </h1>
      <p style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
        Installing gives you a proper app icon, full-screen view, and lets you receive
        notifications when a patient's results or scans are uploaded.
      </p>

      {platform === 'ios' && (
        <InstructionBlock
          title="On iPhone / iPad (Safari)"
          steps={[
            'Tap the Share icon at the bottom of the screen (the square with an arrow).',
            'Scroll down and tap "Add to Home Screen".',
            'Tap "Add" in the top right.',
            'Open PRISM Alerts from your home screen icon \u2014 notifications only work once installed this way.',
          ]}
        />
      )}

      {platform === 'android' && (
        <>
          {installEvent ? (
            <button onClick={handleInstallClick} style={primaryButtonStyle}>
              Install App
            </button>
          ) : (
            <InstructionBlock
              title="On Android (Chrome)"
              steps={[
                'Tap the three-dot menu in the top right.',
                'Tap "Add to Home screen" or "Install app".',
                'Confirm by tapping "Install".',
              ]}
            />
          )}
        </>
      )}

      {platform === 'desktop' && (
        <InstructionBlock
          title="On a computer (Chrome / Edge)"
          steps={[
            'Look for the install icon in the address bar (a monitor with a down arrow).',
            'Click it, then click "Install".',
            'Not required to use PRISM Alerts, but recommended for the best experience.',
          ]}
        />
      )}

      {platform === 'unknown' && (
        <InstructionBlock
          title="Add to your home screen"
          steps={[
            'Look for an "Add to Home Screen" or "Install" option in your browser\u2019s menu.',
          ]}
        />
      )}

      {installed && (
        <p style={{ color: colors.success, fontSize: 13, marginTop: 16 }}>
          Installed  you can continue below, or reopen from your home screen icon.
        </p>
      )}

      <button onClick={handleContinue} style={{ ...secondaryButtonStyle, marginTop: 'auto' }}>
        {standalone ? 'Close' : 'Continue to Sign In \u2192'}
      </button>
    </div>
  );
}

function InstructionBlock({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 20,
        marginBottom: 8,
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{title}</h2>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, i) => (
          <li key={i} style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 1.5 }}>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  height: 50,
  border: 'none',
  backgroundColor: colors.primary,
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 8,
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  height: 46,
  border: `1px solid ${colors.border}`,
  backgroundColor: 'transparent',
  color: colors.mutedForeground,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export function hasSeenInstallInstructions(): boolean {
  return localStorage.getItem(SEEN_KEY) === '1';
}