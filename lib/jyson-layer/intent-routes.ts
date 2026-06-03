/**
 * ACCESS V5 — keyword intent routing (foundation for JYSON navigation).
 */

export type AccessIntentMatch = {
  route: string
  response: string
}

export const ACCESS_INTENT_ROUTES: {
  keywords: string[]
  route: string
  response: string
}[] = [
  {
    keywords: ['project', 'building', 'build', 'working on', 'what am i building'],
    route: '/projects',
    response: 'Opening Projects — this is where ACCESS tracks what you are building.',
  },
  {
    keywords: ['memory', 'remember', 'what do you know', 'what does jyson remember', 'recall'],
    route: '/memory',
    response: 'Opening Memory — this is what JYSON uses to understand your work.',
  },
  {
    keywords: ['agent', 'team', 'assistant', 'teammate'],
    route: '/agents',
    response: 'Opening Agents — this is where your AI teammates live.',
  },
  {
    keywords: [
      'billing',
      'subscription',
      'plan',
      'stripe',
      'checkout',
      'payment',
      'manage subscription',
      'upgrade',
      'invoice',
    ],
    route: '/settings/billing',
    response: 'Opening Billing — plans, subscriptions, and Stripe are managed here.',
  },
  {
    keywords: ['offer', 'sell', 'pricing', 'revenue', 'package what i sell'],
    route: '/offers',
    response: 'Opening Offers — this is where ACCESS packages what you sell.',
  },
  {
    keywords: ['registry', 'system record', 'catalog', 'connected system'],
    route: '/registry',
    response: 'Opening Registry — system records for your workspace.',
  },
  {
    keywords: ['founder', 'blueprint', 'identity', 'profile setup'],
    route: '/founder',
    response: 'Opening Founder blueprint — identity and ventures for JYSON.',
  },
  {
    keywords: ['jyson', 'companion', 'ask jyson', 'ai companion'],
    route: '/companion',
    response: 'Opening JYSON — your full intelligence view.',
  },
  {
    keywords: ['home', 'dashboard', 'command center', 'workspace'],
    route: '/dashboard',
    response: 'Opening Home — your intelligent command center.',
  },
  {
    keywords: ['setting', 'account', 'profile', 'integration'],
    route: '/settings',
    response: 'Opening Settings — account, billing, and tools.',
  },
  {
    keywords: ['connect stripe', 'stripe integration'],
    route: '/settings/billing',
    response: 'Opening Billing — connect and manage Stripe here.',
  },
  {
    keywords: ['local tool', 'openjarvis', 'connector', 'local file'],
    route: '/companion#diagnostics',
    response: 'Opening JYSON diagnostics — connect local tools on your machine.',
  },
]

export function matchAccessIntent(input: string): AccessIntentMatch | null {
  const t = input.trim().toLowerCase()
  if (!t) return null

  let best: { route: string; response: string; score: number } | null = null

  for (const entry of ACCESS_INTENT_ROUTES) {
    for (const kw of entry.keywords) {
      if (t.includes(kw.toLowerCase())) {
        const score = kw.length
        if (!best || score > best.score) {
          best = { route: entry.route, response: entry.response, score }
        }
      }
    }
  }

  if (best) {
    return { route: best.route, response: best.response }
  }

  if (/\b(show|open|go to)\s+my\s+projects?\b/.test(t)) {
    return {
      route: '/projects',
      response: ACCESS_INTENT_ROUTES[0].response,
    }
  }

  return null
}
