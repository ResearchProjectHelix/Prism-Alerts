import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../lib/colors';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deactivated = searchParams.get('deactivated') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Invalid credentials. Please try again.');
      setIsLoading(false);
      return;
    }

    navigate('/alerts', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 28px 40px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
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
          <div style={{ color: colors.foreground, fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>
            PRISM
          </div>
          <div style={{ color: colors.primary, fontSize: 11, fontWeight: 600, letterSpacing: 2 }}>
            ALERTS
          </div>
        </div>
      </div>

      <p style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8 }}>
        Sign in with your PRISM account
      </p>

      {deactivated && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #cf5a5a44',
            backgroundColor: '#cf5a5a18',
            color: colors.destructive,
            fontSize: 13,
          }}
        >
          Your account has been deactivated. Please contact your organisation administrator.
        </div>
      )}

      <form onSubmit={handleSignIn} style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: colors.mutedForeground, textTransform: 'uppercase' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="clinician@hospital.ie"
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: colors.mutedForeground, textTransform: 'uppercase' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: colors.mutedForeground,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid #cf5a5a44',
              backgroundColor: '#cf5a5a18',
              color: colors.destructive,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            borderRadius: 10,
            height: 50,
            border: 'none',
            backgroundColor: colors.primary,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 0.3,
            cursor: isLoading ? 'default' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {isLoading ? 'Signing in\u2026' : 'Sign In'}
        </button>
      </form>

      <p style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginTop: 'auto' }}>
        No account creation allowed  contact your administrator.
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.input,
  color: colors.foreground,
  fontSize: 15,
  padding: '0 14px',
  boxSizing: 'border-box',
};