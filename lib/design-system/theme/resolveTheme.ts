import type { ThemeMode } from '../tokens'
import { getScheduledTheme } from './schedule'
import { readThemePreference, type ThemePreference } from './storage'

export function resolveTheme(
  preference: ThemePreference = readThemePreference(),
  now: Date = new Date()
): ThemeMode {
  if (preference === 'day') return 'day'
  if (preference === 'night') return 'night'
  return getScheduledTheme(now)
}

export function applyThemeToDocument(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode)
}
