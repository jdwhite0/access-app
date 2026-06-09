import type { Department, PhoneNumber, ServiceLine, PipelineStage } from '../types'

export const PHONE_MAP: Record<PhoneNumber, { label: string; role: string; department: Department; platform: string }> = {
  '813': { label: 'Legacy Founder Line', role: 'Transitioning to business', department: 'hq', platform: 'AT&T' },
  '678': { label: 'Headquarters', role: 'Main reception / switchboard', department: 'hq', platform: 'Quo/OpenPhone' },
  '407': { label: 'Operations', role: 'Client intake, scheduling, production', department: 'operations', platform: 'Quo/OpenPhone' },
}

export const DEPARTMENT_ROUTING: Record<string, Department> = {
  'new-client': 'hq',
  'existing-client': 'operations',
  'vendor-partner': 'partnerships',
  'media-inquiry': 'media',
  'founder-office': 'hq',
}

export const SERVICE_ROUTING: Record<ServiceLine, Department> = {
  'jd-productions': 'jd-productions',
  'bridge-video': 'bridge-video',
  'access': 'access',
  'regal': 'regal',
}

export const PIPELINE_STAGES: PipelineStage[] = [
  'new-inquiry',
  'captured',
  'qualified',
  'priority-scored',
  'callback-needed',
  'discovery-scheduled',
  'proposal-needed',
  'proposal-sent',
  'follow-up-due',
  'won',
  'lost',
  'dormant',
]

export const SLACK_CHANNELS = {
  hq: '#pipe-mgr',
  operations: '#pipe-mgr',
  new_leads: '#pipe-mgr',
  sales_pipeline: '#pipe-mgr',
  client_success: '#pipe-mgr',
  partnerships: '#pipe-mgr',
  media: '#pipe-mgr',
  founder: '#pipe-mgr',
  system_alerts: '#pipe-mgr',
  revenue_dashboard: '#pipe-mgr',
}

export const CALLBACK_CADENCE = [
  { day: 0, label: 'Same day', action: 'Initial callback' },
  { day: 1, label: 'Day 1', action: 'Follow-up text/email' },
  { day: 3, label: 'Day 3', action: 'Second follow-up' },
  { day: 7, label: 'Day 7', action: 'Final follow-up' },
  { day: 14, label: 'Day 14', action: 'Move to nurture' },
]

export const PRIORITY_THRESHOLDS = {
  high: { minBudget: 2000, maxTimelineDays: 30 },
  medium: { minBudget: 0, maxTimelineDays: 90 },
}

export const HIGH_PRIORITY_TRAITS = [
  'decision-maker',
  'business-owner',
  'founder',
  'organization-leader',
  'existing-client-referral',
  'media-opportunity',
  'strategic-partnership',
  'recurring-revenue-potential',
]

export const MOCK_DEPARTMENT_NUMBERS = {
  'hq': '+16785551201',
  'operations': '+14075551202',
  'jd-productions': '+14075551203',
  'bridge-video': '+14075551204',
  'access': '+14075551205',
  'regal': '+14075551206',
  'media': '+16785551207',
  'partnerships': '+16785551208',
}
