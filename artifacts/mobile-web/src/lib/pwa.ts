/**
 * Detects whether the app is currently running as an installed PWA
 * (launched from a home-screen icon) rather than in a regular browser
 * tab. This is more reliable than a localStorage flag for deciding
 * whether to show install instructions, because on iOS the home-screen
 * app runs in a separate storage context from Safari — a flag set in
 * Safari before installing does not carry over to the installed app.
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Standard check (Android/Chrome/Edge, and iOS 16.4+ in some cases)
  const matchesDisplayMode = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari's legacy, non-standard property — still the reliable
  // signal on iOS today.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return matchesDisplayMode || iosStandalone;
}