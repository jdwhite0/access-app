import type { RegistrySummary } from '@/types/db'
import { matchAccessIntent } from './intent-routes'
import { primaryNavHref } from './context-lines'
import type { PrimaryNavId } from '@/lib/navigation/types'

export type NavIntent = {
  href: string
  ack: string
}

const NAV_PATTERNS: { re: RegExp; id: PrimaryNavId; label: string }[] = [
  { re: /\b(go to |open |take me to |navigate to )home\b/i, id: 'home', label: 'Home' },
  { re: /\b(go to |open |take me to |navigate to )projects?\b/i, id: 'projects', label: 'Projects' },
  { re: /\b(go to |open |take me to |navigate to )(jyson|companion)\b/i, id: 'companion', label: 'JYSON' },
  { re: /\b(go to |open |take me to |navigate to )agents?\b/i, id: 'agents', label: 'Agents' },
  { re: /\b(go to |open |take me to |navigate to )memor(y|ies)\b/i, id: 'memory', label: 'Memory' },
  { re: /\b(go to |open |take me to |navigate to )offers?\b/i, id: 'offers', label: 'Offers' },
  { re: /\b(go to |open |take me to |navigate to )registry\b/i, id: 'registry', label: 'Registry' },
  { re: /\b(go to |open |take me to |navigate to )settings?\b/i, id: 'settings', label: 'Settings' },
]

/** Explicit navigation phrasing — avoids hijacking general chat that mentions "projects" or "memory". */
const EXPLICIT_NAV_PREFIX =
  /\b(go to|open|take me to|navigate to|show me the|bring me to)\b/i

/** Vault / founder-note questions must reach POST /api/jyson/chat (not local registry stubs). */
const VAULT_CHAT_PATTERNS: RegExp[] = [
  /\bpriorit(y|ies)\b/i,
  /\btoday\b/i,
  /\bdaily\/|today\.md\b/i,
  /\bbrain\/|brain notes?\b/i,
  /\b(command |jd )?vault\b/i,
  /\bobsidian\b/i,
  /\bmy notes?\b/i,
  /\bwhat('s| is) in my (vault|files|notes)\b/i,
  /\bsummarize my vault\b/i,
  /\bagent[_ ]?boot\b/i,
  /\bfounder (os|vault|blueprint notes?)\b/i,
  /\bwhat (did i|have i) (write|document|capture)\b/i,
  /\bwhat deserves attention\b/i,
  /\bwhat should i (focus|work on|do) (today|now)\b/i,
  /\bwhat are my priorities\b/i,
  /\bconnector status\b/i,
]

/** General knowledge / explanations — must reach POST /api/jyson/chat, not registry stubs. */
const GENERAL_CHAT_PATTERNS: RegExp[] = [
  /\bexplain\b/i,
  /\bwhat is\b/i,
  /\bhow does\b/i,
  /\boauth\b/i,
  /\bhelp me understand\b/i,
]

export function isGeneralKnowledgeChat(input: string): boolean {
  const t = input.trim()
  if (!t) return false
  if (shouldUseVaultChat(t)) return true
  return GENERAL_CHAT_PATTERNS.some((re) => re.test(t))
}

export function shouldUseVaultChat(input: string): boolean {
  const t = input.trim()
  if (!t) return false
  return VAULT_CHAT_PATTERNS.some((re) => re.test(t))
}

export function isExplicitNavRequest(input: string): boolean {
  const t = input.trim()
  if (!t) return false
  if (EXPLICIT_NAV_PREFIX.test(t)) return true
  if (/\b(show|open)\s+my\s+(projects?|agents?|memory|offers?|registry|settings?|billing)\b/i.test(t)) {
    return true
  }
  return false
}

export function resolveNavIntent(input: string): NavIntent | null {
  const t = input.trim()
  if (!t) return null

  if (/\b(go to |open |take me to |navigate to )?(founder|blueprint)\b/i.test(t) && isExplicitNavRequest(t)) {
    return { href: '/founder', ack: 'Opening Founder blueprint.' }
  }

  for (const { re, id, label } of NAV_PATTERNS) {
    if (re.test(t)) {
      return {
        href: primaryNavHref(id),
        ack: `Opening ${label}.`,
      }
    }
  }

  if (!isExplicitNavRequest(t)) {
    return null
  }

  const matched = matchAccessIntent(input)
  if (matched) {
    return { href: matched.route, ack: matched.response }
  }

  return null
}

/**
 * Local registry snapshot — only for ultra-short workspace count queries.
 * Everything else (including vault, priorities, explanations) goes to runChat.
 */
export function answerFromWorld(
  input: string,
  summary: RegistrySummary | null
): string | null {
  if (shouldUseVaultChat(input) || isGeneralKnowledgeChat(input)) {
    return null
  }

  const t = input.trim()
  const lower = t.toLowerCase()

  if (!t || t.length > 80) return null

  const counts = summary?.registryCounts ?? summary?.counts

  if (/^how many projects?\??$/i.test(t)) {
    const n = counts?.projects ?? 0
    return `You have ${n} project${n === 1 ? '' : 's'} registered. Ask me to open Projects or dig into what you're building.`
  }

  if (/^how many agents?\??$/i.test(t)) {
    const n = counts?.agents ?? 0
    return `You have ${n} custom agent${n === 1 ? '' : 's'} plus JYSON and OpenJarvis.`
  }

  if (/^who am i\??$/i.test(lower)) {
    if (summary?.identityHandle) {
      return `You are ${summary.identityHandle}. Founder blueprint and Memory hold what I use to help you.`
    }
    return null
  }

  return null
}
