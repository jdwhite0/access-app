'use client'

import { createContext, useContext } from 'react'
import type { ThemeMode } from '../tokens'
import type { ThemePreference } from './storage'

export type ThemeContextValue = {
  preference: ThemePreference
  resolved: ThemeMode
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
