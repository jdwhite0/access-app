import type { RegistrySummary } from '@/types/db'
import type { PrimaryNavId } from '@/lib/navigation/types'
import { primaryNavHref } from './context-lines'

export type NavIntent = {
  href: string
  ack: string
}

const NAV_PATTERNS: { re: RegExp; id: PrimaryNavId; label: string }[] = [
  { re: /\b(go to |open )?home\b/i, id: 'home', label: 'home' },
  { re: /\b(go to |open )?(founder|identity)\b/i, id: 'founder', label: 'identity' },
  { re: /\b(go to |open )?projects?\b/i, id: 'projects', label: 'projects' },
  { re: /\b(go to |open )?agents?\b/i, id: 'agents', label: 'agents' },
  { re: /\b(go to |open )?memor(y|ies)\b/i, id: 'memory', label: 'memory' },
  { re: /\b(go to |open )?registry\b/i, id: 'registry', label: 'registry' },
  { re: /\b(go to |open )?settings?\b/i, id: 'settings', label: 'settings' },
]

export function resolveNavIntent(input: string): NavIntent | null {
  const t = input.trim()
  for (const { re, id, label } of NAV_PATTERNS) {
    if (re.test(t)) {
      return {
        href: primaryNavHref(id),
        ack: `Opening ${label}.`,
      }
    }
  }
  return null
}

export function answerFromWorld(
  input: string,
  summary: RegistrySummary | null
): string | null {
  const t = input.toLowerCase()
  const counts = summary?.registryCounts ?? summary?.counts

  if (
    /\bwhat am i building\b/.test(t) ||
    /\bwhat('re| are) (we|you) building\b/.test(t) ||
    /\bmy projects?\b/.test(t)
  ) {
    const n = counts?.projects ?? 0
    if (n > 0) {
      return `You're building ${n} registered project${n === 1 ? '' : 's'}. I can open Projects or read files on your machine if you name one.`
    }
    if (summary?.identityHandle) {
      return `I don't see projects in your registry yet for ${summary.identityHandle}. Tell me what you're building and we'll capture it — or open Founder to align your blueprint.`
    }
    return "I don't see registered projects yet. Tell me what you're building and we'll start there."
  }

  if (/\bwho am i\b/.test(t) || /\bmy identity\b/.test(t)) {
    if (summary?.identityHandle) {
      return `You are ${summary.identityHandle} in this stack. Founder holds your blueprint; Registry maps your universe.`
    }
    return 'Your identity is still loading — try again in a moment.'
  }

  if (/\bmy agents?\b/.test(t) || /\bwho is helping\b/.test(t)) {
    const n = counts?.agents ?? 0
    if (n > 0) return `You have ${n} agent${n === 1 ? '' : 's'} registered. Opening Agents shows the full list.`
    return 'No agents in registry yet. Ask me to help define who should assist you.'
  }

  if (/\bmy memor(y|ies)\b/.test(t)) {
    const n = counts?.vaults ?? counts?.systems ?? 0
    if (n > 0) return `Knowledge is linked across ${n} system object${n === 1 ? '' : 's'}. Memory surfaces what we capture from conversation and vault sync.`
    return 'Memory grows as we work. Open Memory or ask me to recall something specific.'
  }

  if (/\bregistry\b/.test(t) && /\bwhat\b/.test(t)) {
    const total = summary?.totalRegistered ?? 0
    if (total > 0) return `Your registry has ${total} mapped object${total === 1 ? '' : 's'} — organizations, products, systems, and agents.`
    return 'Registry is your universe map. As you build, objects appear here automatically.'
  }

  return null
}
