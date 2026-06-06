/**
 * Public plan display + Stripe metadata for UI/checkout.
 * Revenue targets and acquisition math live only in
 * `docs/_internal/EXECUTIVE_PRICING_STRATEGY.md` — never in UI strings or user-facing exports.
 */
import type { StripePlan } from './client'
import type { BillingInterval } from './prices'

// ─── Pricing ──────────────────────────────────────────────────────────────────

type BillablePlan = 'personal' | 'operator' | 'builder'

/** Standard monthly prices (USD). operator = legacy alias for personal. */
export const PLAN_MONTHLY_USD: Record<BillablePlan, number> = {
  personal: 29,
  operator: 29,   // legacy
  builder:  99,
}

/** Annual prices — ~2 months free (16.7% discount). */
export const PLAN_ANNUAL_USD: Record<BillablePlan, number> = {
  personal: 290,
  operator: 290,  // legacy
  builder:  990,
}

/** Equivalent monthly rate when billed annually. */
export const PLAN_ANNUAL_EQ_MONTHLY_USD: Record<BillablePlan, number> = {
  personal: 24,
  operator: 24,  // legacy
  builder:  83,
}

/** Annual savings vs 12 monthly payments. */
export const PLAN_ANNUAL_SAVINGS_USD: Record<BillablePlan, number> = {
  personal: 58,
  operator: 58,  // legacy
  builder:  198,
}

// ─── Payment method display (ACH savings) ─────────────────────────────────────

/** Processing fee rates for display copy. */
export const PAYMENT_FEES = {
  card: { rate: 0.029, fixed: 0.30, label: '2.9% + $0.30' },
  ach:  { rate: 0.008, fixed: 0.00, label: '0.8%' },
} as const

/** Calculate ACH savings vs card for a given monthly amount. */
export function calcAchSavings(monthlyAmount: number): number {
  const cardFee = monthlyAmount * PAYMENT_FEES.card.rate + PAYMENT_FEES.card.fixed
  const achFee  = monthlyAmount * PAYMENT_FEES.ach.rate
  return Math.round((cardFee - achFee) * 100) / 100
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** @deprecated Use PLAN_MONTHLY_USD */
export const PLAN_FOUNDING_MONTHLY_USD = PLAN_MONTHLY_USD
/** @deprecated Use PLAN_ANNUAL_USD */
export const PLAN_FOUNDING_ANNUAL_USD = PLAN_ANNUAL_USD
/** @deprecated Use PLAN_MONTHLY_USD */
export const PLAN_PUBLIC_MONTHLY_USD = PLAN_MONTHLY_USD
/** @deprecated Use PLAN_MONTHLY_USD */
export const PLAN_LAUNCH_MONTHLY_USD = PLAN_MONTHLY_USD

export const LAUNCH_COUPON_ID = ''  // no active launch coupon

export type PlanDisplayPricing = {
  amount: number
  periodLabel: string
  originalAmount?: number
  launchLabel?: string
  equivalentMonthly?: number
  savingsLabel?: string
}

function isBillable(plan: Exclude<StripePlan, 'enterprise'>): plan is BillablePlan {
  return plan === 'personal' || plan === 'operator' || plan === 'builder'
}

export function getPlanDisplayPricing(
  plan: Exclude<StripePlan, 'enterprise'>,
  interval: BillingInterval
): PlanDisplayPricing {
  const p = isBillable(plan) ? plan : 'personal'
  if (interval === 'month') {
    return {
      amount: PLAN_MONTHLY_USD[p],
      periodLabel: '/month',
    }
  }
  return {
    amount: PLAN_ANNUAL_USD[p],
    periodLabel: '/year',
    equivalentMonthly: PLAN_ANNUAL_EQ_MONTHLY_USD[p],
    savingsLabel: `Save $${PLAN_ANNUAL_SAVINGS_USD[p].toLocaleString('en-US')} vs monthly.`,
  }
}

export function getPlanCta(
  plan: Exclude<StripePlan, 'enterprise'>,
  interval: BillingInterval
): string {
  const isPersonal = plan === 'personal' || plan === 'operator'
  if (interval === 'year') {
    return isPersonal ? 'Start Personal annually' : 'Start Builder annually'
  }
  return isPersonal ? 'Get started — $29/month' : 'Start free 14-day trial'
}

export function getPlanBadges(
  plan: StripePlan,
  interval: BillingInterval
): string[] {
  if (plan === 'enterprise') return ['ENTERPRISE']
  const isPersonal = plan === 'personal' || plan === 'operator'
  if (interval === 'year') {
    if (!isPersonal) return ['MOST POPULAR', 'ANNUAL']
    return ['ANNUAL']
  }
  if (!isPersonal) return ['MOST POPULAR']
  return []
}

// ─── Tier configs ─────────────────────────────────────────────────────────────

export type PlanTierConfig = {
  id: StripePlan
  title: string
  shortName: string
  subtitle: string
  checkoutDescription: string
  dashboardDescription: string
  includes: string[]
  cta: string
  highlight?: boolean
  metadata: Record<string, string>
  brandingDisplayName: string
}

const PERSONAL_METADATA: Record<string, string> = {
  plan_tier: 'personal',
  product_family: 'access',
  primary_outcome: 'personal_ai_workspace',
  includes_jyson: 'limited',
  includes_memory: 'true',
  includes_projects: 'limited',
  includes_agents: 'false',
  includes_offers: 'false',
  includes_registry: 'limited',
  target_user: 'individual_builders',
}

const BUILDER_METADATA: Record<string, string> = {
  plan_tier: 'builder',
  product_family: 'access',
  primary_outcome: 'build_systems_with_ai',
  includes_jyson: 'true',
  includes_memory: 'true',
  includes_projects: 'true',
  includes_agents: 'true',
  includes_offers: 'true',
  includes_registry: 'true',
  target_user: 'founders_creators_operators',
}

const ENTERPRISE_METADATA: Record<string, string> = {
  plan_tier: 'enterprise',
  product_family: 'access',
  primary_outcome: 'ai_native_org_operations',
  includes_jyson: 'advanced',
  includes_memory: 'true',
  includes_projects: 'true',
  includes_agents: 'advanced',
  includes_offers: 'true',
  includes_registry: 'true',
  target_user: 'teams_organizations',
}

export const PLAN_TIERS: PlanTierConfig[] = [
  {
    id: 'personal',
    title: 'ACCESS Personal',
    shortName: 'Personal',
    subtitle: 'For individuals organizing their world and building personal systems with AI.',
    checkoutDescription:
      'Start building with JYSON — your AI companion for personal projects, memory, and workspace organization.',
    dashboardDescription:
      'Your personal AI workspace for organizing ideas, projects, and memory with JYSON.',
    includes: [
      'JYSON (100 messages/month)',
      '3 active projects',
      'Personal vault (5GB)',
      'Registry (25 objects)',
      'Personal memory (30 days)',
      'Knowledge base',
    ],
    cta: 'Get started — $29/month',
    metadata: PERSONAL_METADATA,
    brandingDisplayName: 'ACCESS Personal',
  },
  {
    id: 'builder',
    title: 'ACCESS Builder',
    shortName: 'Builder',
    subtitle:
      'For founders, creators, consultants, agencies, nonprofits, and operators running a business.',
    checkoutDescription:
      'Run your operation with ACCESS — registry, projects, CRM, workflows, offers, and JYSON business intelligence in one platform.',
    dashboardDescription:
      'Build companies, systems, products, content, and workflows with an AI that understands your world.\n\nACCESS Builder gives you JYSON, permanent memory, projects, agents, offers, registry intelligence, and connected workspace context so you can turn ideas into operating systems.',
    includes: [
      'JYSON (1,000 messages/month + business context)',
      'Unlimited projects',
      'CRM (500 contacts)',
      'Workflows (10 automations)',
      '5 vaults (50GB each)',
      'Offers catalog',
      'Full registry + blueprints',
      'Permanent business memory',
      'Priority support',
    ],
    cta: 'Start free 14-day trial',
    highlight: true,
    metadata: BUILDER_METADATA,
    brandingDisplayName: 'ACCESS Builder',
  },
  {
    id: 'enterprise',
    title: 'ACCESS Enterprise',
    shortName: 'Enterprise',
    subtitle: 'For teams and organizations scaling their operation with AI infrastructure.',
    checkoutDescription:
      'Operate your organization with ACCESS — team collaboration, RBAC permissions, advanced JYSON intelligence, compliance tools, and API access.',
    dashboardDescription:
      'Operate teams, organizations, workflows, and intelligent systems with ACCESS as your AI-native command layer.',
    includes: [
      'Everything in Builder',
      '10 team seats ($25/seat after)',
      'JYSON — unlimited + team intelligence',
      'RBAC permissions',
      'Audit logs & compliance tools',
      'Advanced analytics',
      'Full REST API access',
      'Custom integrations',
      'Dedicated support + SLA',
    ],
    cta: 'Get started — $299/month',
    metadata: ENTERPRISE_METADATA,
    brandingDisplayName: 'ACCESS Enterprise',
  },
]

export function getPlanTier(plan: StripePlan): PlanTierConfig | undefined {
  // legacy 'operator' maps to personal tier config
  const lookupId = (plan === 'operator') ? 'personal' : plan
  return PLAN_TIERS.find((t) => t.id === lookupId)
}

export function buildCheckoutSessionMetadata(
  plan: StripePlan,
  clerkUserId: string,
  interval: BillingInterval = 'month'
): Record<string, string> {
  const tier = getPlanTier(plan)
  return {
    clerk_user_id: clerkUserId,
    plan,
    billing_interval: interval,
    ...(tier?.metadata ?? {}),
  }
}
