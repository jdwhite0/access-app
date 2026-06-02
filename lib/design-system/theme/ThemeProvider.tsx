'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeMode } from '../tokens'
import { msUntilNextThemeChange } from './schedule'
import { applyThemeToDocument, resolveTheme } from './resolveTheme'
import {
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from './storage'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('auto')
  const [resolved, setResolved] = useState<ThemeMode>('night')

  const syncResolved = useCallback((pref: ThemePreference) => {
    const next = resolveTheme(pref)
    setResolved(next)
    applyThemeToDocument(next)
  }, [])

  useEffect(() => {
    setPreferenceState(readThemePreference())
    syncResolved(readThemePreference())
  }, [syncResolved])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next)
      writeThemePreference(next)
      syncResolved(next)
    },
    [syncResolved]
  )

  useEffect(() => {
    if (preference !== 'auto') return

    let timeoutId: ReturnType<typeof setTimeout>

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        syncResolved('auto')
        scheduleNext()
      }, msUntilNextThemeChange())
    }

    scheduleNext()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncResolved('auto')
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [preference, syncResolved])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
