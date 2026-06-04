export const LOCAL_TOOLS_ACTIVATED_KEY = 'access-local-tools-activated-at'

export function readLocalToolsActivatedHint(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(localStorage.getItem(LOCAL_TOOLS_ACTIVATED_KEY))
  } catch {
    return false
  }
}

export function markLocalToolsActivated(): void {
  if (typeof window === 'undefined') return
  try {
    if (!localStorage.getItem(LOCAL_TOOLS_ACTIVATED_KEY)) {
      localStorage.setItem(LOCAL_TOOLS_ACTIVATED_KEY, new Date().toISOString())
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearLocalToolsActivatedHint(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_TOOLS_ACTIVATED_KEY)
  } catch {
    /* ignore */
  }
}
