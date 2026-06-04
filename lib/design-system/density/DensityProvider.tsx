'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type DensityMode = 'comfortable' | 'more-space' | 'larger-text'

const STORAGE_KEY = 'access_display_density'
const DEFAULT_DENSITY: DensityMode = 'comfortable'

type DensityContextValue = {
  density: DensityMode
  setDensity: (mode: DensityMode) => void
}

const DensityContext = createContext<DensityContextValue>({
  density: DEFAULT_DENSITY,
  setDensity: () => {},
})

export function useDensity() {
  return useContext(DensityContext)
}

function readStoredDensity(): DensityMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'comfortable' || v === 'more-space' || v === 'larger-text') return v
  } catch {}
  return null
}

function applyDensity(mode: DensityMode) {
  document.documentElement.setAttribute('data-density', mode)
}

/** Script injected into <head> to set density before first paint — prevents flash. */
export const DENSITY_INIT_SCRIPT = `
(function(){
  try {
    var v = localStorage.getItem('${STORAGE_KEY}');
    if(v==='comfortable'||v==='more-space'||v==='larger-text'){
      document.documentElement.setAttribute('data-density', v);
    } else {
      document.documentElement.setAttribute('data-density', '${DEFAULT_DENSITY}');
    }
  } catch(e) {}
})();
`

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>(DEFAULT_DENSITY)

  useEffect(() => {
    const stored = readStoredDensity()
    if (stored) {
      setDensityState(stored)
      applyDensity(stored)
    } else {
      applyDensity(DEFAULT_DENSITY)
    }
  }, [])

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode)
    applyDensity(mode)
    try { localStorage.setItem(STORAGE_KEY, mode) } catch {}
  }, [])

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  )
}

export const DENSITY_LABELS: Record<DensityMode, { title: string; desc: string }> = {
  comfortable:  { title: 'Comfortable', desc: 'Balanced spacing for everyday use.' },
  'more-space': { title: 'More Space',  desc: 'A sharper, denser workspace for larger screens.' },
  'larger-text':{ title: 'Larger Text', desc: 'Increases readability across the interface.' },
}
