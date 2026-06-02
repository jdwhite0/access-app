/**
 * ACCESS OS — canonical design tokens (source of truth).
 * CSS variables are generated in styles/themes.css from these values.
 */

export type ThemeMode = 'day' | 'night'

export type ColorTokens = {
  bg: string
  bgElevated: string
  surface: string
  surfaceRaised: string
  surfaceHover: string
  border: string
  borderStrong: string
  text: string
  textDim: string
  textMuted: string
  accent: string
  accentGlow: string
  accentMuted: string
  success: string
  successMuted: string
  warning: string
  warningMuted: string
  error: string
  errorMuted: string
  info: string
  infoMuted: string
  onAccent: string
}

export type TypographyTokens = {
  fontSans: string
  fontMono: string
  sizeXs: string
  sizeSm: string
  sizeMd: string
  sizeLg: string
  sizeXl: string
  sizeDisplay: string
  weightNormal: number
  weightMedium: number
  weightSemibold: number
  trackingTight: string
  trackingWide: string
  trackingWider: string
  lineNormal: number
  lineRelaxed: number
}

export type SpacingTokens = {
  0: string
  1: string
  2: string
  3: string
  4: string
  5: string
  6: string
  8: string
}

export type RadiusTokens = {
  sm: string
  md: string
  lg: string
  pill: string
}

export type ShadowTokens = {
  sm: string
  md: string
  glow: string
  insetAccent: string
}

export type StatusTokens = {
  operational: string
  degraded: string
  blocked: string
  offline: string
}

export type SurfaceLayerTokens = {
  base: string
  shell: string
  panel: string
  overlay: string
  topbarHeight: string
  railWidth: string
  contextWidth: string
}

export type AccessDesignTokens = {
  mode: ThemeMode
  colors: ColorTokens
  typography: TypographyTokens
  spacing: SpacingTokens
  radius: RadiusTokens
  shadows: ShadowTokens
  status: StatusTokens
  surfaces: SurfaceLayerTokens
}

const typography: TypographyTokens = {
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
  sizeXs: '0.625rem',
  sizeSm: '0.6875rem',
  sizeMd: '0.75rem',
  sizeLg: '0.875rem',
  sizeXl: '1.375rem',
  sizeDisplay: 'clamp(1.5rem, 4vw, 2rem)',
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  trackingTight: '-0.02em',
  trackingWide: '0.06em',
  trackingWider: '0.14em',
  lineNormal: 1.5,
  lineRelaxed: 1.65,
}

const spacing: SpacingTokens = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
}

const radius: RadiusTokens = {
  sm: '2px',
  md: '3px',
  lg: '6px',
  pill: '999px',
}

/** Night — current ACCESS OS identity (canonical) */
export const nightTokens: AccessDesignTokens = {
  mode: 'night',
  colors: {
    bg: '#030303',
    bgElevated: '#050505',
    surface: '#0a0a0a',
    surfaceRaised: '#111111',
    surfaceHover: 'rgba(64, 192, 208, 0.06)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.1)',
    text: '#f0f0f0',
    textDim: 'rgba(240, 240, 240, 0.55)',
    textMuted: 'rgba(240, 240, 240, 0.28)',
    accent: '#40C0D0',
    accentGlow: 'rgba(64, 192, 208, 0.08)',
    accentMuted: 'rgba(64, 192, 208, 0.45)',
    success: '#4ABDA0',
    successMuted: 'rgba(74, 189, 160, 0.12)',
    warning: '#C9A46A',
    warningMuted: 'rgba(201, 164, 106, 0.1)',
    error: '#E07B52',
    errorMuted: 'rgba(224, 123, 82, 0.12)',
    info: '#40C0D0',
    infoMuted: 'rgba(64, 192, 208, 0.1)',
    onAccent: '#030303',
  },
  typography,
  spacing,
  radius,
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.35)',
    md: '0 8px 24px rgba(0, 0, 0, 0.45)',
    glow: '0 0 24px rgba(64, 192, 208, 0.12)',
    insetAccent: 'inset 3px 0 0 #40C0D0',
  },
  status: {
    operational: '#4ABDA0',
    degraded: '#C9A46A',
    blocked: '#E07B52',
    offline: '#6b7280',
  },
  surfaces: {
    base: '#030303',
    shell: '#0a0a0a',
    panel: '#0a0a0a',
    overlay: 'rgba(3, 3, 3, 0.92)',
    topbarHeight: '48px',
    railWidth: '200px',
    contextWidth: '300px',
  },
}

/** Day — lighter ACCESS OS, same terminal / command-center feel */
export const dayTokens: AccessDesignTokens = {
  mode: 'day',
  colors: {
    bg: '#E4EAEE',
    bgElevated: '#DCE3E8',
    surface: '#F2F5F7',
    surfaceRaised: '#FFFFFF',
    surfaceHover: 'rgba(64, 192, 208, 0.1)',
    border: 'rgba(12, 22, 32, 0.12)',
    borderStrong: 'rgba(12, 22, 32, 0.18)',
    text: '#0F1419',
    textDim: 'rgba(15, 20, 25, 0.72)',
    textMuted: 'rgba(15, 20, 25, 0.48)',
    accent: '#1A8FA0',
    accentGlow: 'rgba(64, 192, 208, 0.14)',
    accentMuted: 'rgba(26, 143, 160, 0.55)',
    success: '#2D8A6E',
    successMuted: 'rgba(45, 138, 110, 0.14)',
    warning: '#9A7B3C',
    warningMuted: 'rgba(154, 123, 60, 0.12)',
    error: '#B85A3A',
    errorMuted: 'rgba(184, 90, 58, 0.12)',
    info: '#1A8FA0',
    infoMuted: 'rgba(64, 192, 208, 0.12)',
    onAccent: '#FFFFFF',
  },
  typography,
  spacing,
  radius,
  shadows: {
    sm: '0 2px 8px rgba(12, 22, 32, 0.08)',
    md: '0 8px 24px rgba(12, 22, 32, 0.1)',
    glow: '0 0 20px rgba(64, 192, 208, 0.15)',
    insetAccent: 'inset 3px 0 0 #1A8FA0',
  },
  status: {
    operational: '#2D8A6E',
    degraded: '#9A7B3C',
    blocked: '#B85A3A',
    offline: '#64748b',
  },
  surfaces: {
    base: '#E4EAEE',
    shell: '#F2F5F7',
    panel: '#F2F5F7',
    overlay: 'rgba(228, 234, 238, 0.95)',
    topbarHeight: '48px',
    railWidth: '200px',
    contextWidth: '300px',
  },
}

export function getTokensForMode(mode: ThemeMode): AccessDesignTokens {
  return mode === 'day' ? dayTokens : nightTokens
}
