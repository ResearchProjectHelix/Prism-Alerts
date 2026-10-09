import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  previewDesktopLogin: (requestId: string, secret: string) => Promise<{ organizationName: string }>;
  approveDesktopLogin: (requestId: string, secret: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  previewDesktopLogin: async () => ({ organizationName: '' }),
  approveDesktopLogin: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const previewDesktopLogin = useCallback(async (requestId: string, secret: string) => {
    const { data, error } = await supabase.functions.invoke('approve-desktop-login', {
      body: { action: 'preview', requestId, secret },
    });
    if (error) throw new Error(data?.error || error.message || 'Unable to check this sign-in request.');
    if (data?.error) throw new Error(data.error);
    if (typeof data?.organizationName !== 'string') throw new Error('Invalid sign-in request.');
    return { organizationName: data.organizationName };
  }, []);

  const approveDesktopLogin = useCallback(async (requestId: string, secret: string) => {
    const { data, error } = await supabase.functions.invoke('approve-desktop-login', {
      body: { action: 'approve', requestId, secret },
    });
    if (error) throw new Error(data?.error || error.message || 'Unable to approve this sign-in.');
    if (data?.error) throw new Error(data.error);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, isLoading, signIn, signOut, previewDesktopLogin, approveDesktopLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
