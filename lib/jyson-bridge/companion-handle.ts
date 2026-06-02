import { currentUser } from '@clerk/nextjs/server'

export function deriveUsername(user: Awaited<ReturnType<typeof currentUser>>): string {
  if (!user) return 'guest'
  const github = user.externalAccounts?.find((a) => (a.provider as string) === 'oauth_github')
  if (github?.username) return github.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (user.username) return user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (user.fullName) {
    return user.fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }
  return 'guest'
}

export function toAccessHandle(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  return `${base}.access`
}

export async function deriveAccessHandleForSession(): Promise<string> {
  const user = await currentUser()
  return toAccessHandle(deriveUsername(user))
}
