import type { RegistrySummary } from '@/types/db'
import { matchAccessIntent } from './intent-routes'
import { primaryNavHref } from './context-lines'
import type { PrimaryNavId } from '@/lib/navigation/types'

export type NavIntent = {
  href: string
  ack: string
}

const NAV_PATTERNS: { re: RegExp; id: PrimaryNavId; label: string }[] = [
  { re: /\b(go to |open )?home\b/i, id: 'home', label: 'Home' },
  { re: /\b(go to |open )?projects?\b/i, id: 'projects', label: 'Projects' },
  { re: /\b(go to |open )?(jyson|companion)\b/i, id: 'companion', label: 'JYSON' },
  { re: /\b(go to |open )?agents?\b/i, id: 'agents', label: 'Agents' },
  { re: /\b(go to |open )?memor(y|ies)\b/i, id: 'memory', label: 'Memory' },
  { re: /\b(go to |open )?offers?\b/i, id: 'offers', label: 'Offers' },
  { re: /\b(go to |open )?registry\b/i, id: 'registry', label: 'Registry' },
  { re: /\b(go to |open )?settings?\b/i, id: 'settings', label: 'Settings' },
]

export function resolveNavIntent(input: string): NavIntent | null {
  const matched = matchAccessIntent(input)
  if (matched) {
    return { href: matched.route, ack: matched.response }
  }

  const t = input.trim()
  if (/\b(go to |open )?(founder|blueprint)\b/i.test(t)) {
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
  return null
}

export function answerFromWorld(
  input: string,
  summary: RegistrySummary | null
): string | null {
  const t = input.toLowerCase()
  const counts = summary?.registryCounts ?? summary?.counts

  if (
    /\bwhat am i working\b/.test(t) ||
    /\bwhat('re| are) (we|you) building\b/.test(t) ||
    /\bmy projects?\b/.test(t) ||
    /\bshow my projects\b/.test(t) ||
    /\bsummarize my workspace\b/.test(t)
  ) {
    const n = counts?.projects ?? 0
    const agents = counts?.agents ?? 0
    if (n > 0) {
      return `You have ${n} project${n === 1 ? '' : 's'} and ${agents} agent${agents === 1 ? '' : 's'} in your workspace. I can open Projects or walk through priorities here.`
    }
    return "No projects registered yet. Tell me what you're building, or open Projects to create one."
  }

  if (/\bwhat deserves attention\b/.test(t) || /\bwhat should i do next\b/.test(t)) {
    const n = counts?.projects ?? 0
    if (/stripe|billing|subscription/i.test(t) || !n) {
      return 'Finish subscription setup in Billing so ACCESS can accept paying users — then define your first offer in Offers.'
    }
    return 'Review active projects first, then confirm billing and local tools are connected so I can read your workspace.'
  }

  if (/\bwho am i\b/.test(t) || /\bmy identity\b/.test(t)) {
    if (summary?.identityHandle) {
      return `You are ${summary.identityHandle}. Founder blueprint and Memory hold what I use to help you.`
    }
    return 'Your identity is still loading — try again in a moment.'
  }

  if (/\bmy agents?\b/.test(t) || /\bwho is helping\b/.test(t) || /\bshow agents\b/.test(t)) {
    const n = counts?.agents ?? 0
    if (n > 0) return `You have ${n} custom agent${n === 1 ? '' : 's'} plus JYSON and OpenJarvis. Open Agents for the full list.`
    return 'JYSON and OpenJarvis are always available. Register custom agents from Terminal when you need specialists.'
  }

  if (/\bmy memor(y|ies)\b/.test(t) || /\bwhat do you remember\b/.test(t)) {
    return 'Open Memory to review what I know from your blueprint, sessions, and vault sync.'
  }

  if (/\bregistry\b/.test(t) && /\bwhat\b/.test(t)) {
    const total = summary?.totalRegistered ?? 0
    if (total > 0) return `Your registry has ${total} record${total === 1 ? '' : 's'} — organizations, products, systems, and agents.`
    return 'Registry holds system records for your workspace. They appear as you build.'
  }

  if (/\bwhat changed\b/.test(t) || /\brecently\b/.test(t)) {
    return 'Check Home for your latest thread, vault sync status, and suggested next actions.'
  }

  return null
}
