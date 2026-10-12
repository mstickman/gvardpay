/**
 * GvardPay Design System — Color Tokens
 * Premium dark theme with electric accents
 */

/**
 * GvardPay Design System — Color Tokens
 * Тёмная, строгая тема (v2)
 */

export const Colors = {
  // Backgrounds
  background: '#0A0B0D',
  backgroundSecondary: '#0A0B0D',
  surface: '#16181D',
  surfaceLight: '#1E2126',
  surfaceHover: '#242731',

  // Primary palette (accent)
  primary: '#4C7EFF',
  primaryLight: '#6E96FF',
  primaryDark: '#3763DB',
  primaryGlow: 'rgba(76, 126, 255, 0.25)',

  // Secondary palette
  secondary: '#00D9FF',
  secondaryLight: '#33E3FF',
  secondaryDark: '#00B8D9',
  secondaryGlow: 'rgba(0, 217, 255, 0.2)',

  // Accent (декоративный, не основной CTA)
  accent: '#4C7EFF',
  accentGlow: 'rgba(76, 126, 255, 0.2)',

  // Status colors
  success: '#34D399',
  successLight: '#5EE8B5',
  successGlow: 'rgba(52, 211, 153, 0.2)',

  warning: '#FFB800',
  warningLight: '#FFC933',
  warningGlow: 'rgba(255, 184, 0, 0.2)',

  error: '#F87171',
  errorLight: '#FB9C9C',
  errorGlow: 'rgba(248, 113, 113, 0.2)',

  // Text
  textPrimary: '#F5F6F7',
  textSecondary: '#8B9099',
  textTertiary: '#6B7078',
  textMuted: '#4A4D54',

  // Borders
  border: '#2A2D33',
  borderLight: '#34373D',
  borderFocus: '#4C7EFF',

  // Gradients (as arrays of [start, end]) — оставлены для мест, где ещё используется LinearGradient
  gradientPrimary: ['#4C7EFF', '#00D9FF'] as const,
  gradientSuccess: ['#34D399', '#00D9FF'] as const,
  gradientWarm: ['#FFB800', '#F87171'] as const,
  gradientDark: ['#16181D', '#0A0B0D'] as const,
  gradientCard: ['#16181D', '#1E2126'] as const,

  // Stablecoin brand colors
  usdc: '#2775CA',
  usdt: '#26A17B',
  sol: '#9945FF',

  // Glass effect — оставлено для обратной совместимости, новые экраны используют surface/border
  glassBackground: '#16181D',
  glassBorder: '#2A2D33',
  glassOverlay: 'rgba(255, 255, 255, 0.03)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorKey = keyof typeof Colors;

