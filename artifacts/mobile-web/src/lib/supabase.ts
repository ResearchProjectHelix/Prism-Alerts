import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly at build/runtime rather than silently hitting an undefined
  // backend — this is the same Supabase project the desktop app and old
  // Expo app used, so a missing env var here means login will look broken
  // for a confusing, hard-to-diagnose reason.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Check your .env file (see .env.example).',
  );
}

// In a browser context, the Supabase client defaults to `window.localStorage`
// for session persistence — no AsyncStorage needed (that was React Native-only).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
