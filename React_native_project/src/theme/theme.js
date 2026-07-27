export const COLORS = {
  background: '#0B0F19', // Deep dark blue-black
  card: '#161F30',       // Dark blue-slate card background
  cardBorder: '#23304A', // Subtle border color for cards
  primary: '#3B82F6',    // Electric blue
  primaryHover: '#2563EB',
  accent: '#EF4444',     // Neon coral red (Gate Closed)
  success: '#10B981',    // Vivid emerald green (Gate Open)
  warning: '#F59E0B',    // Amber/yellow (Closing Soon)
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  overlay: 'rgba(11, 15, 25, 0.8)',
  glassBackground: 'rgba(22, 31, 48, 0.7)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8.30,
    elevation: 10,
  },
};
