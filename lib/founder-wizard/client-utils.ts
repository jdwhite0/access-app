/** UI-only helpers for Founder Blueprint Wizard (not P2 backend). */

export function deriveUsername(user: {
  username?: string | null
  firstName?: string | null
  fullName?: string | null
  emailAddresses?: Array<{ emailAddress: string }>
  externalAccounts?: Array<{ provider: string; username?: string | null }>
} | null | undefined): string {
  if (!user) return 'guest-builder'
  const github = user.externalAccounts?.find(a => a.provider === 'oauth_github')
  if (github?.username) return github.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (user.username) return user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const name = user.fullName
  if (name) return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return 'guest-builder'
}

export function toAccessHandle(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  return `${base}.access`
}

export function slugFromLabel(label: string): string {
  let s = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!s) s = 'item'
  if (!/^[a-z0-9]/.test(s)) s = `x-${s}`
  if (!/[a-z0-9]$/.test(s)) s = `${s}-x`
  return s.slice(0, 64)
}

export function downloadTextFile(filename: string, content: string, mime = 'text/yaml;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
