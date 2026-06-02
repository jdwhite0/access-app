import type { ThemePreference } from './storage'

/**
 * ACCESS OS theme schedule (local device time).
 * Sync index.html inline script when changing boundaries.
 *
 * Override: localStorage.setItem('access-theme-preference', 'auto'|'day'|'night')
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto'

/** Day: 5:30 AM – 5:59 PM */
export const DAY_START_MINUTES = 5 * 60 + 30

/** Night: 6:00 PM – 5:29 AM */
export const NIGHT_START_MINUTES = 18 * 60

export const STORAGE_KEY = 'access-theme-preference'
