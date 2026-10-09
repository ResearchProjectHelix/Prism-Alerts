import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';
import { supabase } from '../lib/supabase';
import { openPrismDesktop } from '../lib/electron';

type PageState = 'loading' | 'password_form' | 'complete' | 'electron_error' | 'error';
type LinkMode = 'invite' | 'recovery';

const SESSION_TIMEOUT_MS = 10_000;

function readLinkMode(url: URL): LinkMode {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  return (hashParams.get('type') ?? url.searchParams.get('type')) === 'recovery'
    ? 'recovery'
    : 'invite';
}

function getLinkError(url: URL): string | null {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const raw = url.searchParams.get('error_description')
    ?? url.searchParams.get('error')
    ?? hashParams.get('error_description')
    ?? hashParams.get('error');

  if (!raw) return null;
  const message = raw.replaceAll('+', ' ').toLowerCase();
  if (message.includes('expired') || message.includes('otp_expired')) {
    return 'This link has expired. Ask your organisation administrator to send a new invitation or password reset link.';
  }
  return 'This link is invalid or has already been used. Ask your organisation administrator for a new link.';
}

function clearAuthParams(url: URL) {
  window.history.replaceState({}, document.title, url.pathname);
}

export function InviteAcceptPage() {
  const { isLoading } = useAuth();
  const navigate = useNavigate();
  const callbackHandled = useRef(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [linkMode, setLinkMode] = useState<LinkMode>('invite');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningDesktop, setIsOpeningDesktop] = useState(false);

  useEffect(() => {
    if (isLoading || callbackHandled.current) return;
    callbackHandled.current = true;

    const verifyLink = async () => {
      const url = new URL(window.location.href);
      const mode = readLinkMode(url);
      setLinkMode(mode);

      const linkError = getLinkError(url);
      if (linkError) {
        setError(linkError);
        setPageState('error');
        return;
      }

      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      let verificationError: Error | null = null;
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        verificationError = exchangeError;
      } else if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: mode,
        });
        verificationError = otpError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        verificationError = sessionError;
      }

      if (verificationError) {
        const message = verificationError.message.toLowerCase();
        setError(message.includes('expired')
          ? 'This link has expired. Ask your organisation administrator to send a new one.'
          : 'We could not verify this link. It may have expired or already been used. Ask your organisation administrator for a new one.');
        setPageState('error');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (session) {
        clearAuthParams(url);
        setPageState('password_form');
        return;
      }

      // An invitation using the implicit flow may establish its session asynchronously.
      const nextSession = await new Promise<boolean>((resolve) => {
        let settled = false;
        let subscription: { unsubscribe: () => void } | undefined;
        const finish = (hasSession: boolean) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          subscription?.unsubscribe();
          resolve(hasSession);
        };
        const timeoutId = window.setTimeout(() => finish(false), SESSION_TIMEOUT_MS);
        const result = supabase.auth.onAuthStateChange((_event, nextAuthSession) => {
          if (nextAuthSession) finish(true);
        });
        subscription = result.data.subscription;
      });

      if (nextSession) {
        clearAuthParams(url);
        setPageState('password_form');
      } else {
        setError('We could not verify your account from this link. Open the invitation email again or ask your organisation administrator to send a new one.');
        setPageState('error');
      }
    };

    void verifyLink().catch((caught: unknown) => {
      const message = caught instanceof Error ? caught.message.toLowerCase() : '';
      setError(message.includes('fetch') || message.includes('network')
        ? 'We could not connect to PRISM. Check your internet connection and try again.'
        : 'We could not complete authentication. Ask your organisation administrator to send a new link.');
      setPageState('error');
    });
  }, [isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError('Your password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('The passwords do not match. Please check and try again.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) {
      setFormError(updateError.message.toLowerCase().includes('fetch')
        ? 'We could not connect to PRISM. Check your internet connection and try again.'
        : 'We could not save your password. Please try again.');
      return;
    }
    setPageState('complete');
  };

  const handleOpenDesktop = async () => {
    setIsOpeningDesktop(true);
    setError(null);
    const result = await openPrismDesktop();
    setIsOpeningDesktop(false);
    if (result === 'not_installed' || result === 'failed') {
      setError('PRISM Desktop could not be opened. Make sure it is installed, then try again.');
      setPageState('electron_error');
    }
  };

  const heading = linkMode === 'recovery' ? 'Reset your password' : 'Create your account';
  const subtitle = linkMode === 'recovery'
    ? 'Choose a new password for your PRISM account.'
    : "You've been invited to PRISM. Set a password to finish creating your account.";

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>
          <img src="/icons/icon-round.png" alt="" style={logoStyle} />
          <div>
            <div style={{ fontSize: 21, fontWeight: 750, letterSpacing: 1.5 }}>PRISM</div>
            <div style={{ color: colors.primary, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>CONNECT</div>
          </div>
        </div>

        {pageState === 'loading' && (
          <>
            <h1 style={headingStyle}>Verifying your link</h1>
            <p style={subtitleStyle}>Please wait while we securely confirm your invitation.</p>
            <div style={{ marginTop: 18, color: colors.mutedForeground, textAlign: 'center' }}>Connecting to PRISM…</div>
          </>
        )}

        {pageState === 'error' && (
          <>
            <h1 style={headingStyle}>Unable to continue</h1>
            <p style={subtitleStyle}>We couldn’t complete authentication.</p>
            <div role="alert" style={errorStyle}>{error}</div>
            <button type="button" onClick={() => navigate('/login', { replace: true })} style={secondaryButtonStyle}>Go to sign in</button>
          </>
        )}

        {pageState === 'password_form' && (
          <>
            <h1 style={headingStyle}>{heading}</h1>
            <p style={subtitleStyle}>{subtitle}</p>
            <form onSubmit={(event) => void handleSubmit(event)} style={formStyle} noValidate>
              <label style={labelStyle} htmlFor="invite-password">Password</label>
              <div style={passwordWrapStyle}>
                <input id="invite-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required style={inputStyle} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} style={toggleStyle}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <label style={labelStyle} htmlFor="invite-confirm-password">Confirm password</label>
              <div style={passwordWrapStyle}>
                <input id="invite-confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required style={inputStyle} />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} style={toggleStyle}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
              </div>
              <div style={requirementsStyle}>
                <span style={{ color: password.length >= 8 ? colors.success : colors.mutedForeground }}>● At least 8 characters</span>
                {confirmPassword.length > 0 && <span style={{ color: password === confirmPassword ? colors.success : colors.destructive }}>● Passwords {password === confirmPassword ? 'match' : 'do not match'}</span>}
              </div>
              {formError && <div role="alert" style={errorStyle}>{formError}</div>}
              <button type="submit" disabled={isSaving || password.length < 8 || password !== confirmPassword} style={{ ...primaryButtonStyle, opacity: isSaving || password.length < 8 || password !== confirmPassword ? 0.6 : 1 }}>
                {isSaving ? 'Please wait…' : linkMode === 'recovery' ? 'Update password' : 'Create PRISM account'}
              </button>
            </form>
          </>
        )}

        {pageState === 'complete' && (
          <>
            <h1 style={headingStyle}>{linkMode === 'recovery' ? 'Password updated' : 'Account ready'}</h1>
            <p style={subtitleStyle}>{linkMode === 'recovery' ? 'Your PRISM password has been updated.' : 'Your PRISM account is set up and ready to use.'}</p>
            <button type="button" disabled={isOpeningDesktop} onClick={() => void handleOpenDesktop()} style={primaryButtonStyle}>
              {isOpeningDesktop ? 'Opening PRISM…' : 'Open PRISM Desktop'}
            </button>
            <button type="button" onClick={() => navigate('/alerts', { replace: true })} style={secondaryButtonStyle}>Continue to PRISM Connect</button>
            <p style={{ ...subtitleStyle, marginTop: 14, marginBottom: 0 }}>Sign in to PRISM Desktop with the password you just created.</p>
          </>
        )}

        {pageState === 'electron_error' && (
          <>
            <h1 style={headingStyle}>Open PRISM Desktop</h1>
            <p style={subtitleStyle}>{error}</p>
            <button type="button" disabled={isOpeningDesktop} onClick={() => void handleOpenDesktop()} style={primaryButtonStyle}>
              {isOpeningDesktop ? 'Opening PRISM…' : 'Try again'}
            </button>
            <button type="button" onClick={() => navigate('/alerts', { replace: true })} style={secondaryButtonStyle}>Continue to PRISM Connect</button>
          </>
        )}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100dvh', padding: 24, display: 'grid', placeItems: 'center', background: colors.background, color: colors.foreground };
const cardStyle: React.CSSProperties = { width: '100%', maxWidth: 440, padding: 30, borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.surface, boxShadow: '0 24px 48px rgba(0,0,0,.28)', boxSizing: 'border-box' };
const brandStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 };
const logoStyle: React.CSSProperties = { width: 48, height: 48, borderRadius: 12, objectFit: 'cover' };
const headingStyle: React.CSSProperties = { margin: '0 0 8px', textAlign: 'center', fontSize: 24, fontWeight: 700 };
const subtitleStyle: React.CSSProperties = { margin: '0 0 22px', color: colors.mutedForeground, textAlign: 'center', lineHeight: 1.55, fontSize: 14 };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
const labelStyle: React.CSSProperties = { color: colors.mutedForeground, fontSize: 13, fontWeight: 600 };
const passwordWrapStyle: React.CSSProperties = { position: 'relative', marginBottom: 8 };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', height: 46, boxSizing: 'border-box', padding: '0 64px 0 12px', border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.input, color: colors.foreground, fontSize: 15 };
const toggleStyle: React.CSSProperties = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 0, background: 'transparent', color: colors.mutedForeground, cursor: 'pointer', fontSize: 12 };
const requirementsStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, margin: '2px 0 8px', fontSize: 12 };
const errorStyle: React.CSSProperties = { margin: '12px 0', padding: 12, borderRadius: 8, color: colors.destructive, background: '#cf5a5a18', border: '1px solid #cf5a5a44', fontSize: 13, lineHeight: 1.45 };
const primaryButtonStyle: React.CSSProperties = { display: 'block', width: '100%', minHeight: 48, marginTop: 8, padding: '10px 14px', border: 0, borderRadius: 9, background: colors.primary, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { display: 'block', width: '100%', minHeight: 46, marginTop: 18, border: `1px solid ${colors.border}`, borderRadius: 9, background: 'transparent', color: colors.foreground, fontWeight: 600, cursor: 'pointer' };