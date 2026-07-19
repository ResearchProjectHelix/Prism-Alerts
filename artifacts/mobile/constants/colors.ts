/**
 * PRISM Alerts design tokens — dark clinical theme.
 * Both light and dark keys use the same dark palette since the app is dark-only.
 */

const palette = {
  // Core surfaces
  background: '#0f1115',
  surface: '#161922',
  surfaceHigh: '#1d2230',

  // Text
  foreground: '#e8e9ec',
  mutedForeground: '#9aa0ad',

  // Borders / inputs
  border: '#262b38',
  input: '#1d2230',

  // Brand / interactive
  primary: '#4a7fd6',
  primaryForeground: '#ffffff',

  // Semantic
  destructive: '#cf5a5a',
  destructiveForeground: '#ffffff',
  warning: '#c9903f',
  warningForeground: '#ffffff',
  success: '#4a9c72',
  successForeground: '#ffffff',

  // Aliases
  accent: '#4a7fd6',
  accentForeground: '#ffffff',
  muted: '#262b38',
  secondary: '#1d2230',
  secondaryForeground: '#e8e9ec',
  card: '#161922',
  cardForeground: '#e8e9ec',
  text: '#e8e9ec',
  tint: '#4a7fd6',
};

const colors = {
  light: palette,
  dark: palette,
  radius: 10,
};

export default colors;
