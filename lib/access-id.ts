type ClerkUser = {
  username?: string | null
  firstName?: string | null
  fullName?: string | null
  emailAddresses?: Array<{ emailAddress: string }>
  externalAccounts?: Array<{ provider: string; username?: string | null }>
} | null | undefined

export function deriveUsername(user: ClerkUser): string {
  if (!user) return 'guest-builder'
  const github = user.externalAccounts?.find((a) => a.provider === 'oauth_github')
  if (github?.username) return github.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (user.username) return user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const name = user.fullName
  if (name) return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return 'guest-builder'
}

export function toAccessId(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
}
