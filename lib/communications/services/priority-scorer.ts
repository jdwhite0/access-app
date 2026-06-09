import type { Lead, Priority } from '../types'
import { HIGH_PRIORITY_TRAITS, PRIORITY_THRESHOLDS } from '../config'

export interface ScoredLead {
  lead: Lead
  score: number
  breakdown: {
    budget: number
    timeline: number
    decisionMaker: number
    referral: number
    media: number
    partnership: number
    recurring: number
    urgency: number
    completeness: number
  }
}

export function scoreLead(lead: Partial<Lead> & { name: string; phone: string }): ScoredLead {
  const b: ScoredLead['breakdown'] = {
    budget: 0,
    timeline: 0,
    decisionMaker: 0,
    referral: 0,
    media: 0,
    partnership: 0,
    recurring: 0,
    urgency: 0,
    completeness: 0,
  }

  if (lead.budget_range) {
    const budgetNum = extractBudget(lead.budget_range)
    if (budgetNum >= 5000) b.budget = 25
    else if (budgetNum >= 2000) b.budget = 20
    else if (budgetNum >= 1000) b.budget = 10
    else b.budget = 5
  }

  if (lead.timeline) {
    const days = extractTimelineDays(lead.timeline)
    if (days <= 14) b.timeline = 20
    else if (days <= 30) b.timeline = 15
    else if (days <= 90) b.timeline = 10
    else b.timeline = 5
  }

  if (lead.decision_maker_status === 'yes') b.decisionMaker = 15
  else if (lead.decision_maker_status === 'unknown') b.decisionMaker = 5

  if (lead.source?.toLowerCase().includes('referral')) b.referral = 10
  if (lead.source?.toLowerCase().includes('media') || lead.service_requested === 'jd-productions') b.media = 10
  if (lead.source?.toLowerCase().includes('partner')) b.partnership = 10
  if (lead.service_requested === 'access') b.recurring = 10

  if (lead.urgency === 'immediate') b.urgency = 10
  else if (lead.urgency === 'soon') b.urgency = 5

  const fields = [lead.name, lead.phone, lead.email, lead.company, lead.service_requested]
  b.completeness = fields.filter(Boolean).length * 4

  const total = Object.values(b).reduce((s, v) => s + v, 0)
  const priority: Priority = total >= 60 ? 'high' : total >= 30 ? 'medium' : 'low'

  const fullLead: Lead = {
    id: lead.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contact_id: lead.contact_id ?? '',
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    source: lead.source ?? 'phone',
    service_requested: lead.service_requested,
    business_type: lead.business_type,
    budget_range: lead.budget_range,
    timeline: lead.timeline,
    location: lead.location,
    urgency: lead.urgency ?? 'unknown',
    decision_maker_status: lead.decision_maker_status ?? 'unknown',
    department: lead.department ?? 'hq',
    priority,
    priority_score: total,
    estimated_value: estimateValue(total, lead),
    pipeline_stage: lead.pipeline_stage ?? 'new-inquiry',
    assigned_agent: lead.assigned_agent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return { lead: fullLead, score: total, breakdown: b }
}

export function estimateValue(score: number, lead: Partial<Lead>): number {
  if (lead.budget_range) {
    const num = extractBudget(lead.budget_range)
    if (!isNaN(num)) return num
  }
  if (score >= 60) return 5000
  if (score >= 30) return 2000
  return 500
}

function extractBudget(range: string): number {
  const nums = range.replace(/[$,]/g, '').match(/\d+/g)
  if (!nums) return 0
  return Math.max(...nums.map(Number))
}

function extractTimelineDays(timeline: string): number {
  const lower = timeline.toLowerCase()
  if (/\b(today|tomorrow|this week|immediate|asap|urgent)\b/.test(lower)) return 1
  if (/\b(this month|next week|within|days)\b/.test(lower)) return 14
  const match = lower.match(/(\d+)\s*(day|week|month|year)/)
  if (!match) return 90
  const num = parseInt(match[1])
  const unit = match[2]
  if (unit.startsWith('day')) return num
  if (unit.startsWith('week')) return num * 7
  if (unit.startsWith('month')) return num * 30
  return num * 365
}

export function determineUrgency(timeline?: string): 'immediate' | 'soon' | 'planning' | 'unknown' {
  if (!timeline) return 'unknown'
  const days = extractTimelineDays(timeline)
  if (days <= 7) return 'immediate'
  if (days <= 30) return 'soon'
  return 'planning'
}
