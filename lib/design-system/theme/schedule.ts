import { DAY_START_MINUTES, NIGHT_START_MINUTES } from './config'
import type { ThemeMode } from '../tokens'

export { DAY_START_MINUTES, NIGHT_START_MINUTES }

export function getScheduledTheme(now: Date = new Date()): ThemeMode {
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes >= DAY_START_MINUTES && minutes < NIGHT_START_MINUTES) {
    return 'day'
  }
  return 'night'
}

export function msUntilNextThemeChange(now: Date = new Date()): number {
  const minutes = now.getHours() * 60 + now.getMinutes()
  const current = getScheduledTheme(now)

  let targetMinutes: number
  if (current === 'day') {
    targetMinutes = NIGHT_START_MINUTES
  } else if (minutes < DAY_START_MINUTES) {
    targetMinutes = DAY_START_MINUTES
  } else {
    targetMinutes = DAY_START_MINUTES + 24 * 60
  }

  const target = new Date(now)
  const dayOffset = targetMinutes >= 24 * 60 ? 1 : 0
  target.setDate(target.getDate() + dayOffset)
  target.setHours(
    Math.floor((targetMinutes % (24 * 60)) / 60),
    targetMinutes % 60,
    0,
    0
  )

  return Math.max(target.getTime() - now.getTime(), 1000)
}
