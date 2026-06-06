/**
 * Plan limit definitions and enforcement helpers.
 * All hard limits live here — one source of truth.
 *
 * Architecture: Personal → Builder → Enterprise
 * null = unlimited
 */

import type { StripePlan } from '@/lib/stripe/client'

export type PlanFeature =
  | 'registryObjects'
  | 'projects'
  | 'storageGb'
  | 'vaults'
  | 'jysonMessagesPerMonth'
  | 'jysonMemoryDays'
  | 'workflows'
  | 'contacts'
  | 'seats'

type LimitMap = Record<PlanFeature, number | null>

export const PLAN_LIMITS: Record<'personal' | 'operator' | 'builder' | 'enterprise', LimitMap> = {
  personal: {
    registryObjects:       25,
    projects:               3,
    storageGb:              5,
    vaults:                 1,
    jysonMessagesPerMonth: 100,
    jysonMemoryDays:        30,
    workflows:               0,
    contacts:                0,
    seats:                   1,
  },
  /** legacy alias — identical to personal */
  operator: {
    registryObjects:       25,
    projects:               3,
    storageGb:              5,
    vaults:                 1,
    jysonMessagesPerMonth: 100,
    jysonMemoryDays:        30,
    workflows:               0,
    contacts:                0,
    seats:                   1,
  },
  builder: {
    registryObjects:       null,
    projects:              null,
    storageGb:              100,
    vaults:                   5,
    jysonMessagesPerMonth: 1000,
    jysonMemoryDays:       null,
    workflows:               10,
    contacts:               500,
    seats:                    1,
  },
  enterprise: {
    registryObjects:       null,
    projects:              null,
    storageGb:             1024,
    vaults:                null,
    jysonMessagesPerMonth: null,
    jysonMemoryDays:       null,
    workflows:             null,
    contacts:              null,
    seats:                   10,
  },
}

/** Whether a plan is a personal-tier plan (Personal or legacy Operator). */
export function isPersonalTier(plan: StripePlan): boolean {
  return plan === 'personal' || plan === 'operator'
}

/** Whether a plan is a builder-tier plan. */
export function isBuilderTier(plan: StripePlan): boolean {
  return plan === 'builder'
}

/** Safely get the limit map for any plan, falling back to personal. */
export function getLimits(plan: StripePlan): LimitMap {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.personal
}

/**
 * Returns true if the user is at or over the limit for a feature.
 * Always returns false when the plan limit is null (unlimited).
 */
export function isAtLimit(plan: StripePlan, feature: PlanFeature, currentCount: number): boolean {
  const limit = getLimits(plan)[feature]
  if (limit === null) return false
  return currentCount >= limit
}

/**
 * Returns the remaining capacity for a feature.
 * Returns Infinity when the plan limit is null (unlimited).
 */
export function remaining(plan: StripePlan, feature: PlanFeature, currentCount: number): number {
  const limit = getLimits(plan)[feature]
  if (limit === null) return Infinity
  return Math.max(0, limit - currentCount)
}

/**
 * Plan features that are completely unavailable (blocked) on Personal.
 * These features return a hard-gate error on Personal/Operator plans.
 */
export const PERSONAL_BLOCKED: PlanFeature[] = ['workflows', 'contacts']

/**
 * Returns true when a feature is blocked entirely (not just limited)
 * based on the user's current plan.
 */
export function isFeatureBlocked(plan: StripePlan, feature: PlanFeature): boolean {
  if (!isPersonalTier(plan)) return false
  return PERSONAL_BLOCKED.includes(feature)
}

// ─── Upgrade trigger copy ─────────────────────────────────────────────────────

export type UpgradeTrigger = {
  feature: string
  headline: string
  description: string
  targetPlan: 'builder' | 'enterprise'
  ctaLabel: string
}

export const UPGRADE_TRIGGERS: Record<string, UpgradeTrigger> = {
  projects_limit: {
    feature: 'Projects',
    headline: 'Your pipeline is growing.',
    description: 'You\'ve reached the 3-project limit on Personal. Builder gives you unlimited projects.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  registry_limit: {
    feature: 'Registry',
    headline: 'Your registry is full.',
    description: 'You\'ve reached 25 objects on Personal. Builder gives you unlimited registry objects.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  jyson_limit: {
    feature: 'JYSON',
    headline: 'You\'ve used 100 JYSON messages.',
    description: 'You\'re asking the right questions. Builder gives you 1,000 messages/month with full business context.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  jyson_approaching: {
    feature: 'JYSON',
    headline: '90% of your JYSON messages used.',
    description: '10 messages remaining this month. Builder gives you 1,000/month.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  workflow_blocked: {
    feature: 'Workflows',
    headline: 'Automation is a Builder feature.',
    description: 'One workflow can replace 5+ hours of manual work per week. Workflows are available on Builder.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  crm_blocked: {
    feature: 'CRM',
    headline: 'Customers & CRM is a Builder feature.',
    description: 'Your first 500 contacts live in Builder. Track your pipeline in one place.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  vault_limit: {
    feature: 'Vaults',
    headline: 'Vault limit reached.',
    description: 'You have 1 vault on Personal. Builder gives you 5 vaults at 50GB each.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  offers_blocked: {
    feature: 'Offers',
    headline: 'Offers catalog is a Builder feature.',
    description: 'Build your service catalog and package your work with Builder.',
    targetPlan: 'builder',
    ctaLabel: 'Upgrade to Builder — $99/month',
  },
  team_invite: {
    feature: 'Team',
    headline: 'Teams run on Enterprise.',
    description: 'Add up to 10 seats with RBAC permissions, team JYSON intelligence, and audit logs.',
    targetPlan: 'enterprise',
    ctaLabel: 'Upgrade to Enterprise — $299/month',
  },
  contacts_limit: {
    feature: 'CRM',
    headline: 'CRM limit reached.',
    description: 'You have 500 contacts on Builder. Enterprise gives you unlimited contacts + pipeline views.',
    targetPlan: 'enterprise',
    ctaLabel: 'Upgrade to Enterprise — $299/month',
  },
  workflow_builder_limit: {
    feature: 'Workflows',
    headline: '10-workflow limit reached.',
    description: 'Enterprise gives you unlimited automations with advanced scheduling and triggers.',
    targetPlan: 'enterprise',
    ctaLabel: 'Upgrade to Enterprise — $299/month',
  },
  builder_jyson_limit: {
    feature: 'JYSON',
    headline: '1,000 JYSON messages used.',
    description: 'Enterprise gives you unlimited JYSON with team intelligence and advanced reporting.',
    targetPlan: 'enterprise',
    ctaLabel: 'Upgrade to Enterprise — $299/month',
  },
}
