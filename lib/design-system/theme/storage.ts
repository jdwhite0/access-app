import { DEFAULT_THEME_PREFERENCE, STORAGE_KEY } from './config'

export type ThemePreference = 'auto' | 'day' | 'night'

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_THEME_PREFERENCE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'auto' || raw === 'day' || raw === 'night') return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_PREFERENCE
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    /* ignore */
  }
}
