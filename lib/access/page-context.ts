/**
 * ACCESS V5 — page context for JYSON awareness on every route.
 */

export type AccessPageContext = {
  pageId: string
  title: string
  purpose: string
  primaryAction?: string
  suggestedPrompts: string[]
  relatedRoutes: { label: string; href: string }[]
}

const PAGES: Record<string, AccessPageContext> = {
  home: {
    pageId: 'home',
    title: 'Home',
    purpose: 'Your intelligent command center — see what you are building and what deserves attention.',
    primaryAction: 'Ask JYSON',
    suggestedPrompts: [
      'What am I working on?',
      'What deserves attention?',
      'Summarize my workspace.',
      'What should I do next?',
    ],
    relatedRoutes: [
      { label: 'Projects', href: '/projects' },
      { label: 'Memory', href: '/memory' },
      { label: 'Billing', href: '/settings/billing' },
    ],
  },
  projects: {
    pageId: 'projects',
    title: 'Projects',
    purpose: 'Track what you are building and let JYSON help move work forward.',
    primaryAction: 'Create project',
    suggestedPrompts: [
      'What am I building?',
      'Show my active projects.',
      'Which project needs attention?',
      'Help me define a new project.',
    ],
    relatedRoutes: [
      { label: 'JYSON', href: '/companion' },
      { label: 'Memory', href: '/memory' },
    ],
  },
  companion: {
    pageId: 'companion',
    title: 'JYSON',
    purpose: 'Your AI companion for navigating, remembering, and building inside ACCESS.',
    primaryAction: 'Ask JYSON',
    suggestedPrompts: [
      'What am I working on?',
      'What deserves attention?',
      'Show my active projects.',
      'Summarize my workspace.',
      'What changed recently?',
      'Help me launch ACCESS.',
    ],
    relatedRoutes: [
      { label: 'Projects', href: '/projects' },
      { label: 'Memory', href: '/memory' },
      { label: 'Agents', href: '/agents' },
    ],
  },
  memory: {
    pageId: 'memory',
    title: 'Memory',
    purpose: 'What JYSON knows, remembers, and uses to help you.',
    primaryAction: 'Review memory',
    suggestedPrompts: [
      'What do you remember about me?',
      'What should I add to memory?',
      'Summarize my blueprint context.',
    ],
    relatedRoutes: [
      { label: 'Founder blueprint', href: '/founder' },
      { label: 'JYSON', href: '/companion' },
    ],
  },
  agents: {
    pageId: 'agents',
    title: 'Agents',
    purpose: 'Create specialized AI teammates for different parts of your work.',
    primaryAction: 'View agents',
    suggestedPrompts: [
      'Who can help me right now?',
      'Show my agent team.',
      'How do I register an agent?',
    ],
    relatedRoutes: [
      { label: 'Terminal', href: '/terminal' },
      { label: 'Registry', href: '/registry' },
    ],
  },
  offers: {
    pageId: 'offers',
    title: 'Offers',
    purpose: 'Package what you sell and connect it to subscriptions, checkout, and delivery.',
    primaryAction: 'Create offer',
    suggestedPrompts: [
      'Help me package my next offer.',
      'What offers do I have active?',
      'Connect Stripe to my offers.',
    ],
    relatedRoutes: [
      { label: 'Billing', href: '/settings/billing' },
      { label: 'Plans', href: '/plans' },
    ],
  },
  registry: {
    pageId: 'registry',
    title: 'Registry',
    purpose: 'System records for your workspace — projects, agents, offers, and connected tools.',
    primaryAction: 'View registry',
    suggestedPrompts: [
      'What is in my registry?',
      'Summarize my connected systems.',
    ],
    relatedRoutes: [
      { label: 'Projects', href: '/projects' },
      { label: 'Settings', href: '/settings' },
    ],
  },
  billing: {
    pageId: 'billing',
    title: 'Billing',
    purpose: 'Manage your plan, subscription, payment method, and usage.',
    primaryAction: 'Manage subscription',
    suggestedPrompts: [
      'What plan am I on?',
      'How do I upgrade?',
      'Connect Stripe checkout.',
    ],
    relatedRoutes: [
      { label: 'Plans', href: '/plans' },
      { label: 'Offers', href: '/offers' },
    ],
  },
  settings: {
    pageId: 'settings',
    title: 'Settings',
    purpose: 'Manage your account, workspace, billing, integrations, and developer tools.',
    primaryAction: 'Open settings',
    suggestedPrompts: [
      'What should I configure next?',
      'Connect local tools.',
    ],
    relatedRoutes: [
      { label: 'Billing', href: '/settings/billing' },
      { label: 'Profile', href: '/settings/profile' },
    ],
  },
  founder: {
    pageId: 'founder',
    title: 'Founder blueprint',
    purpose: 'Define your identity, companies, products, and experiences so JYSON understands your work.',
    primaryAction: 'Continue blueprint',
    suggestedPrompts: [
      'Summarize my founder blueprint.',
      'What is missing from my profile?',
    ],
    relatedRoutes: [
      { label: 'Memory', href: '/memory' },
      { label: 'Registry', href: '/registry' },
    ],
  },
  terminal: {
    pageId: 'terminal',
    title: 'Terminal',
    purpose: 'Advanced command surface for registry, agents, and automation.',
    suggestedPrompts: ['What commands can I run here?'],
    relatedRoutes: [{ label: 'Settings', href: '/settings' }],
  },
}

export function resolveAccessPageContext(pathname: string): AccessPageContext {
  if (pathname.startsWith('/dashboard')) return PAGES.home
  if (pathname.startsWith('/projects')) return PAGES.projects
  if (pathname.startsWith('/companion')) return PAGES.companion
  if (pathname.startsWith('/memory')) return PAGES.memory
  if (pathname.startsWith('/agents')) return PAGES.agents
  if (pathname.startsWith('/offers')) return PAGES.offers
  if (pathname.startsWith('/registry')) return PAGES.registry
  if (pathname.startsWith('/settings/billing')) return PAGES.billing
  if (pathname.startsWith('/plans')) {
    return {
      pageId: 'plans',
      title: 'Plans',
      purpose: 'Choose your level of leverage — how much capability ACCESS and JYSON unlock for you.',
      primaryAction: 'Upgrade plan',
      suggestedPrompts: [
        'What does each plan unlock?',
        'Which plan fits my work?',
        'Manage my subscription',
      ],
      relatedRoutes: [
        { label: 'Billing', href: '/settings/billing' },
        { label: 'Home', href: '/dashboard' },
      ],
    }
  }
  if (pathname.startsWith('/settings')) return PAGES.settings
  if (pathname.startsWith('/founder')) return PAGES.founder
  if (pathname.startsWith('/terminal')) return PAGES.terminal
  if (pathname.startsWith('/internal') || pathname.startsWith('/status')) {
    return {
      pageId: 'operator',
      title: 'Operator',
      purpose: 'Platform health and operator tools.',
      suggestedPrompts: ['What is the platform status?'],
      relatedRoutes: [{ label: 'Settings', href: '/settings' }],
    }
  }
  return {
    pageId: 'workspace',
    title: 'ACCESS',
    purpose: 'Your AI-powered workspace.',
    suggestedPrompts: ['What can I do in ACCESS?'],
    relatedRoutes: [{ label: 'Home', href: '/dashboard' }],
  }
}

export function pageContextLine(ctx: AccessPageContext): string {
  return `${ctx.title} — ${ctx.purpose}`
}
