// ─── SHARED DESIGN TOKENS ─────────────────────────────────────────────────────
export const COLORS = {
  // Background layers (dark neumorphic)
  bg: '#0F1117',
  surface: '#161B27',
  surfaceElevated: '#1E2536',
  surfaceSunken: '#0A0E18',

  // Primary accent (electric indigo)
  accent: '#6366F1',
  accentDark: '#4F46E5',
  accentLight: 'rgba(99,102,241,0.15)',

  // Secondary accent
  teal: '#06B6D4',
  tealLight: 'rgba(6,182,212,0.12)',

  // Role-specific colors
  officialGold: '#F59E0B',
  inspectorBlue: '#3B82F6',
  citizenGreen: '#10B981',

  // Status
  success: '#30D158',
  warning: '#FF9500',
  danger: '#FF2D55',
  critical: '#FF2D55',
  info: '#0A84FF',

  // Risk levels
  riskLow: '#30D158',
  riskMedium: '#FFCC00',
  riskHigh: '#FF9500',
  riskCritical: '#FF2D55',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0F1117',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderBright: 'rgba(255,255,255,0.12)',

  // Neumorphic shadows
  shadowDark: '#080B12',
  shadowLight: 'rgba(99,102,241,0.07)',
};

export const FONT = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 34,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
};
