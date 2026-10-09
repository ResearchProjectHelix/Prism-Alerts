import { useEffect, useRef, useState } from 'react';
import type { BrowserQRCodeReader } from '@zxing/browser';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';

type ConnectChallenge = {
  version: 1;
  requestId: string;
  secret: string;
};

type PagePhase = 'home' | 'scanning' | 'checking' | 'manual' | 'confirm' | 'approving' | 'approved' | 'error';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_PATTERN = /^[0-9a-f]{64}$/i;

export function ConnectPage() {
  const { user, previewDesktopLogin, approveDesktopLogin } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const [phase, setPhase] = useState<PagePhase>('home');
  const [challenge, setChallenge] = useState<ConnectChallenge | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState('');

  const inspectChallenge = async (rawValue: string) => {
    setError('');
    setPhase('checking');

    try {
      const parsed = JSON.parse(rawValue) as Partial<ConnectChallenge>;
      if (
        parsed.version !== 1 ||
        typeof parsed.requestId !== 'string' || !UUID_PATTERN.test(parsed.requestId) ||
        typeof parsed.secret !== 'string' || !SECRET_PATTERN.test(parsed.secret)
      ) {
        throw new Error('That QR code is not a valid PRISM Connect request.');
      }

      const request = { version: 1 as const, requestId: parsed.requestId, secret: parsed.secret };
      const details = await previewDesktopLogin(request.requestId, request.secret);
      setChallenge(request);
      setOrganizationName(details.organizationName);
      setPhase('confirm');
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to check this sign-in request.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (phase !== 'scanning' || !videoRef.current) return;

    let stopped = false;
    let reader: BrowserQRCodeReader | null = null;
    scannerControlsRef.current = null;

    void import('@zxing/browser').then(({ BrowserQRCodeReader: QRReader }) => {
      if (stopped || !videoRef.current) return null;
      reader = new QRReader();
      return reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _decodeError, controls) => {
        if (!result || stopped) return;
        stopped = true;
        controls.stop();
        scannerControlsRef.current = null;
        void inspectChallenge(result.getText());
      });
    }).then((controls) => {
      if (!controls) return;
      if (stopped) controls.stop();
      else scannerControlsRef.current = controls;
    }).catch((cameraError: unknown) => {
      if (stopped) return;
      setError(
        cameraError instanceof Error && cameraError.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow camera access in your browser settings, or enter the QR contents manually.'
          : 'Could not start the camera. Enter the QR contents manually instead.',
      );
      setPhase('manual');
    });

    return () => {
      stopped = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [phase]);

  const handleApprove = async () => {
    if (!challenge) return;
    setError('');
    setPhase('approving');
    try {
      await approveDesktopLogin(challenge.requestId, challenge.secret);
      setPhase('approved');
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : 'Unable to approve this sign-in.');
      setPhase('error');
    }
  };

  const reset = () => {
    setChallenge(null);
    setOrganizationName('');
    setManualValue('');
    setError('');
    setPhase('home');
  };

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <button type="button" onClick={() => navigate('/alerts')} style={backButtonStyle}>
          Back to alerts
        </button>
        <div style={{ marginTop: 24 }}>
          <div style={eyebrowStyle}>PRISM</div>
          <h1 style={titleStyle}>Connect desktop</h1>
          <p style={subtitleStyle}>Approve a sign-in to PRISM Desktop with your signed-in PRISM Connect account.</p>
        </div>
      </header>

      <section style={cardStyle}>
        <p style={signedInStyle}>Signed in as {user?.email || 'your PRISM account'}</p>

        {phase === 'home' && (
          <>
            <p style={bodyStyle}>On the PRISM Desktop sign-in screen, choose <strong>PRISM Connect</strong>. Then scan the QR code shown on that computer.</p>
            <button type="button" onClick={() => { setError(''); setPhase('scanning'); }} style={primaryButtonStyle}>
              Scan desktop QR code
            </button>
            <button type="button" onClick={() => { setError(''); setPhase('manual'); }} style={secondaryButtonStyle}>
              Camera not available?
            </button>
          </>
        )}

        {phase === 'scanning' && (
          <>
            <p style={bodyStyle}>Point your phone camera at the QR code on the PRISM Desktop sign-in screen.</p>
            <video ref={videoRef} muted playsInline style={videoStyle} />
            <button type="button" onClick={reset} style={secondaryButtonStyle}>Cancel scanning</button>
          </>
        )}

        {phase === 'checking' && <p style={bodyStyle}>Checking the sign-in request…</p>}

        {phase === 'manual' && (
          <form onSubmit={(event) => { event.preventDefault(); void inspectChallenge(manualValue.trim()); }}>
            <p style={bodyStyle}>If the camera cannot scan, paste the QR contents here.</p>
            <textarea
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              rows={4}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Paste the PRISM Connect QR contents"
              style={textareaStyle}
            />
            <button type="submit" disabled={!manualValue.trim()} style={primaryButtonStyle}>Check request</button>
            <button type="button" onClick={() => { setError(''); setPhase('scanning'); }} style={secondaryButtonStyle}>Use camera</button>
          </form>
        )}

        {phase === 'confirm' && (
          <>
            <div style={noticeStyle}>
              <div style={eyebrowStyle}>Sign-in request</div>
              <h2 style={orgNameStyle}>{organizationName}</h2>
              <p style={bodyStyle}>This will sign in the PRISM Desktop app for this organisation as <strong>{user?.email || 'your account'}</strong>.</p>
            </div>
            <p style={bodyStyle}>Only approve if you started this request on your own PRISM Desktop. The QR request expires after 90 seconds and can only be used once.</p>
            <button type="button" onClick={() => void handleApprove()} style={primaryButtonStyle}>Approve sign-in</button>
            <button type="button" onClick={reset} style={secondaryButtonStyle}>Cancel</button>
          </>
        )}

        {phase === 'approving' && <p style={bodyStyle}>Approving this sign-in…</p>}

        {phase === 'approved' && (
          <>
            <div style={successStyle}>Sign-in approved</div>
            <p style={bodyStyle}>PRISM Desktop is completing your sign-in. You can leave this screen open or return to Alerts.</p>
            <button type="button" onClick={() => navigate('/alerts')} style={primaryButtonStyle}>Return to alerts</button>
          </>
        )}

        {phase === 'error' && (
          <>
            <div role="alert" style={errorStyle}>{error}</div>
            <button type="button" onClick={reset} style={primaryButtonStyle}>Try again</button>
          </>
        )}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  backgroundColor: colors.background,
  color: colors.foreground,
  padding: '24px 18px 40px',
};

const headerStyle: React.CSSProperties = { width: '100%', maxWidth: 520, margin: '0 auto 22px' };
const backButtonStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 12px',
  background: 'transparent', color: colors.mutedForeground, fontSize: 13,
};
const eyebrowStyle: React.CSSProperties = {
  color: colors.primary, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
};
const titleStyle: React.CSSProperties = { margin: '6px 0 0', fontSize: 26, letterSpacing: -0.4 };
const subtitleStyle: React.CSSProperties = { margin: '8px 0 0', color: colors.mutedForeground, fontSize: 14, lineHeight: 1.5 };
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 520, margin: '0 auto', padding: 20,
  border: `1px solid ${colors.border}`, borderRadius: 14, backgroundColor: colors.surface,
};
const signedInStyle: React.CSSProperties = {
  margin: '0 0 16px', color: colors.mutedForeground, fontSize: 12, overflowWrap: 'anywhere',
};
const bodyStyle: React.CSSProperties = { color: colors.mutedForeground, fontSize: 14, lineHeight: 1.55 };
const primaryButtonStyle: React.CSSProperties = {
  display: 'block', width: '100%', minHeight: 48, marginTop: 14, border: 0,
  borderRadius: 9, backgroundColor: colors.primary, color: '#fff', fontWeight: 700, fontSize: 14,
};
const secondaryButtonStyle: React.CSSProperties = {
  display: 'block', width: '100%', minHeight: 44, marginTop: 10,
  border: `1px solid ${colors.border}`, borderRadius: 9, background: 'transparent',
  color: colors.foreground, fontSize: 13,
};
const videoStyle: React.CSSProperties = {
  display: 'block', width: '100%', maxHeight: '55dvh', minHeight: 220,
  borderRadius: 12, backgroundColor: '#050607', objectFit: 'cover',
};
const textareaStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: 12, border: `1px solid ${colors.border}`,
  borderRadius: 9, backgroundColor: colors.input, color: colors.foreground, fontSize: 13,
  resize: 'vertical',
};
const noticeStyle: React.CSSProperties = {
  padding: 16, border: `1px solid ${colors.border}`, borderRadius: 12,
  backgroundColor: colors.background,
};
const orgNameStyle: React.CSSProperties = { margin: '8px 0', fontSize: 20 };
const successStyle: React.CSSProperties = { color: colors.success, fontWeight: 700, fontSize: 16 };
const errorStyle: React.CSSProperties = {
  padding: 12, border: '1px solid #cf5a5a44', borderRadius: 8,
  backgroundColor: '#cf5a5a18', color: colors.destructive, fontSize: 13, lineHeight: 1.5,
};
