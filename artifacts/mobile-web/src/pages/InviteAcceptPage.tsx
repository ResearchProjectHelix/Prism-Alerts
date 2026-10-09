import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';
import { supabase } from '../lib/supabase';

type InviteState = 'checking' | 'ready' | 'saving' | 'error';

export function InviteAcceptPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const handledCallback = useRef(false);
  const [state, setState] = useState<InviteState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || handledCallback.current) return;
    handledCallback.current = true;

    const acceptInviteLink = async () => {
      const url = new URL(window.location.href);
      const query = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
      const authError = query.get('error_description') || hash.get('error_description');
      if (authError) {
        setError(authError.replaceAll('+', ' '));
        setState('error');
        return;
      }

      const code = query.get('code');
      const tokenHash = query.get('token_hash');
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');

      let authErrorResult: Error | null = null;
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        authErrorResult = exchangeError;
      } else if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'invite',
        });
        authErrorResult = verifyError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authErrorResult = sessionError;
      }

      if (authErrorResult) {
        setError('This invitation link is invalid or has expired. Ask your organisation administrator to send a new invitation.');
        setState('error');
        return;
      }

      if (code || tokenHash || (accessToken && refreshToken)) {
        window.history.replaceState({}, document.title, `${url.pathname}${url.searchParams.get('next') ? `?next=${encodeURIComponent(url.searchParams.get('next')!)}` : ''}`);
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setState('ready');
      } else if (!isLoading) {
        setError('This invitation link is missing its sign-in details. Open the original email link again or ask for a new invitation.');
        setState('error');
      }
    };

    void acceptInviteLink().catch(() => {
      setError('We could not verify this invitation. Ask your organisation administrator to send a new one.');
      setState('error');
    });
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && session && state === 'checking') setState('ready');
  }, [isLoading, session, state]);

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setState('saving');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setState('ready');
      return;
    }
    navigate('/alerts', { replace: true });
  };

  return (
    <main style={{ minHeight: '100dvh', background: colors.background, color: colors.foreground, display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 440, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: 1.5 }}>PRISM <span style={{ color: colors.primary }}>CONNECT</span></div>
        <h1 style={{ fontSize: 24, margin: '28px 0 8px' }}>Accept your invitation</h1>
        <p style={{ color: colors.mutedForeground, lineHeight: 1.5, marginTop: 0 }}>Set a password to finish setting up your PRISM account.</p>

        {state === 'checking' && <p style={{ color: colors.mutedForeground }}>Verifying your invitation…</p>}
        {state === 'error' && (
          <div role="alert" style={{ marginTop: 20, padding: 12, borderRadius: 8, color: colors.destructive, background: '#cf5a5a18', border: '1px solid #cf5a5a44' }}>
            {error}
          </div>
        )}
        {(state === 'ready' || state === 'saving') && (
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            <label style={labelStyle}>New password
              <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} required />
            </label>
            <label style={labelStyle}>Confirm password
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={inputStyle} required />
            </label>
            {error && <div role="alert" style={{ color: colors.destructive, fontSize: 13 }}>{error}</div>}
            <button type="submit" disabled={state === 'saving'} style={{ height: 48, border: 0, borderRadius: 9, background: colors.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {state === 'saving' ? 'Saving…' : 'Set password and continue'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7, color: colors.mutedForeground, fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: 46, padding: '0 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.input, color: colors.foreground, fontSize: 15 };