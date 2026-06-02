const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*\.access$/

export function normalizeAccessHandle(input: string): string {
  return input.trim().toLowerCase()
}

export function isValidAccessHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(normalizeAccessHandle(handle))
}

export function resolveAccessHandle(input: string): {
  valid: boolean
  handle: string
  error?: string
} {
  const handle = normalizeAccessHandle(input)
  if (!handle) {
    return { valid: false, handle: '', error: 'Handle is required.' }
  }
  if (!isValidAccessHandle(handle)) {
    return {
      valid: false,
      handle,
      error: 'Handle must match pattern: lowercase-slug.access',
    }
  }
  return { valid: true, handle }
}
