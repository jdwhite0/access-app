/**
 * Public plan display + Stripe metadata for UI/checkout.
 * Executive revenue targets and acquisition math live only in
 * `docs/_internal/EXECUTIVE_PRICING_STRATEGY.md` — never in UI strings or user-facing exports.
 */
import type { StripePlan } from './client'
import type { BillingInterval } from './prices'

/** Standard monthly prices (USD). */
export const PLAN_MONTHLY_USD: Record<Exclude<StripePlan, 'enterprise'>, number> = {
  operator: 299,
  builder: 599,
}

/** Annual commitment prices (USD). */
export const PLAN_ANNUAL_USD: Record<Exclude<StripePlan, 'enterprise'>, number> = {
  operator: 2388,
  builder: 4788,
}

/** Equivalent monthly when billed annually (USD). */
export const PLAN_ANNUAL_EQ_MONTHLY_USD: Record<Exclude<StripePlan, 'enterprise'>, number> = {
  operator: 199,
  builder: 399,
}

/** Annual savings vs paying monthly for 12 months (USD). */
export const PLAN_ANNUAL_SAVINGS_USD: Record<Exclude<StripePlan, 'enterprise'>, number> = {
  operator: 1200,
  builder: 2400,
}

/** @deprecated Use PLAN_MONTHLY_USD */
export const PLAN_FOUNDING_MONTHLY_USD = PLAN_MONTHLY_USD

/** @deprecated Use PLAN_ANNUAL_USD */
export const PLAN_FOUNDING_ANNUAL_USD = PLAN_ANNUAL_USD

/** @deprecated Use PLAN_MONTHLY_USD */
export const PLAN_PUBLIC_MONTHLY_USD = PLAN_MONTHLY_USD

export type PlanDisplayPricing = {
  amount: number
  periodLabel: string
  equivalentMonthly?: number
  savingsLabel?: string
}

export function getPlanDisplayPricing(
  plan: Exclude<StripePlan, 'enterprise'>,
  interval: BillingInterval
): PlanDisplayPricing {
  if (interval === 'month') {
    return {
      amount: PLAN_MONTHLY_USD[plan],
      periodLabel: '/month',
    }
  }

  return {
    amount: PLAN_ANNUAL_USD[plan],
    periodLabel: '/year',
    equivalentMonthly: PLAN_ANNUAL_EQ_MONTHLY_USD[plan],
    savingsLabel: `Save $${PLAN_ANNUAL_SAVINGS_USD[plan].toLocaleString('en-US')}/year compared to monthly.`,
  }
}

export function getPlanCta(
  plan: Exclude<StripePlan, 'enterprise'>,
  interval: BillingInterval
): string {
  if (interval === 'year') {
    return plan === 'operator' ? 'Start Operator annually' : 'Start Builder annually'
  }
  return plan === 'operator' ? 'Start Operator' : 'Start Builder'
}

export function getPlanBadges(
  plan: StripePlan,
  interval: BillingInterval
): string[] {
  if (plan === 'enterprise') {
    return ['ENTERPRISE']
  }
  if (interval === 'year') {
    if (plan === 'builder') {
      return ['RECOMMENDED', 'ANNUAL COMMITMENT']
    }
    return ['ANNUAL COMMITMENT']
  }
  if (plan === 'builder') {
    return ['RECOMMENDED']
  }
  return ['OPERATOR']
}

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

const OPERATOR_METADATA: Record<string, string> = {
  plan_tier: 'operator',
  product_family: 'access',
  primary_outcome: 'personal_ai_workspace',
  includes_jyson: 'true',
  includes_memory: 'true',
  includes_projects: 'true',
  includes_agents: 'limited',
  includes_offers: 'false',
  includes_registry: 'true',
  target_user: 'individual_builders',
  pricing_tier: 'commitment',
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
  pricing_tier: 'commitment',
}

const ENTERPRISE_METADATA: Record<string, string> = {
  plan_tier: 'enterprise',
  product_family: 'access',
  primary_outcome: 'ai_native_org_operations',
  includes_jyson: 'true',
  includes_memory: 'true',
  includes_projects: 'true',
  includes_agents: 'advanced',
  includes_offers: 'true',
  includes_registry: 'true',
  target_user: 'teams_organizations',
}

export const PLAN_TIERS: PlanTierConfig[] = [
  {
    id: 'operator',
    title: 'ACCESS Operator',
    shortName: 'Operator',
    subtitle:
      'For individuals who want JYSON to organize projects, memory, next actions, and workspace intelligence.',
    checkoutDescription:
      'Organize your work with JYSON — your AI companion for projects, memory, next actions, and intelligent workspace guidance.',
    dashboardDescription:
      'Your personal AI workspace for organizing projects, memory, and next actions with JYSON.\n\nUse ACCESS to understand what you are building, stay organized, and move faster with an AI companion that remembers your work.',
    includes: [
      'JYSON AI companion',
      'Project workspace',
      'Memory layer',
      'Registry records',
      'Agent workspace',
      'Dashboard and next actions',
    ],
    cta: 'Start Operator',
    metadata: OPERATOR_METADATA,
    brandingDisplayName: 'ACCESS Operator',
  },
  {
    id: 'builder',
    title: 'ACCESS Builder',
    shortName: 'Builder',
    subtitle:
      'For founders, creators, and operators building products, offers, systems, content, workflows, and businesses.',
    checkoutDescription:
      'Build companies, systems, products, content, and workflows with JYSON — your AI companion for memory, projects, agents, offers, and connected workspace intelligence.',
    dashboardDescription:
      'Build companies, systems, products, content, and workflows with an AI that understands your world.\n\nACCESS Builder gives you JYSON, memory, projects, agents, offers, registry intelligence, and connected workspace context so you can turn ideas into operating systems.',
    includes: [
      'Everything in Operator',
      'Offers workspace',
      'Workflows and systems',
      'Local connector and OpenJarvis tools',
      'Vault scan and sync',
      'Priority support',
      'Advanced JYSON recommendations',
    ],
    cta: 'Start Builder',
    highlight: true,
    metadata: BUILDER_METADATA,
    brandingDisplayName: 'ACCESS Builder',
  },
  {
    id: 'enterprise',
    title: 'ACCESS Enterprise',
    shortName: 'Enterprise',
    subtitle:
      'For teams and organizations operating with agents, workflows, collaboration, and custom infrastructure.',
    checkoutDescription:
      'Operate your organization with ACCESS — an AI-native workspace for teams, agents, memory, workflows, integrations, and intelligent execution.',
    dashboardDescription:
      'Operate teams, organizations, workflows, and intelligent systems with ACCESS as your AI-native command layer.\n\nDesigned for advanced collaboration, agent teams, custom integrations, governance, and enterprise-grade operating infrastructure.',
    includes: [
      'Everything in Builder',
      'Team and organization rollout',
      'Custom integrations',
      'Dedicated implementation support',
      'Enterprise infrastructure planning',
    ],
    cta: 'Contact sales',
    metadata: ENTERPRISE_METADATA,
    brandingDisplayName: 'ACCESS Enterprise',
  },
]

export function getPlanTier(plan: StripePlan): PlanTierConfig | undefined {
  return PLAN_TIERS.find((t) => t.id === plan)
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
