export type Arm = 'consulting' | 'bridge-video' | 'access'

export type PipelineStage =
  | 'IDENTIFIED'
  | 'SCORED'
  | 'QUEUED'
  | 'OUTREACH_SENT'
  | 'FOLLOW_UP_1'
  | 'FOLLOW_UP_2'
  | 'FOLLOW_UP_3'
  | 'REPLIED'
  | 'CALL_BOOKED'
  | 'PROPOSED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'NURTURE_30'

export type AgentCode =
  | 'SCOUT-CON'
  | 'SCOUT-BV'
  | 'REACH-CON'
  | 'REACH-BV'
  | 'PUB-ACCESS'
  | 'PIPE-MGR'
  | 'REPORT-2X'

export type QuotaStatus = 'PENDING' | 'ON_TRACK' | 'BEHIND' | 'COMPLETE' | 'SKIPPED'

export type MessageType = 'OUTREACH_1' | 'FOLLOW_UP_1' | 'FOLLOW_UP_2' | 'FOLLOW_UP_3'

export type ReportType = 'MORNING' | 'EVENING' | 'WEEKLY' | 'MONTHLY'

export interface PipelineLead {
  id: string
  arm: Arm
  stage: PipelineStage
  first_name?: string
  last_name?: string
  email: string
  company?: string
  title?: string
  website?: string
  linkedin_url?: string
  instagram_url?: string
  industry?: string
  location?: string
  icp_score?: number
  icp_notes?: string
  source_agent: AgentCode | 'MANUAL'
  source_url?: string
  outreach_count: number
  last_outreach_at?: string
  next_action_at?: string
  next_action?: string
  reply_received_at?: string
  call_booked_at?: string
  call_notes?: string
  proposal_sent_at?: string
  proposal_amount?: number
  closed_at?: string
  closed_value?: number
  loss_reason?: string
  nurture_until?: string
  flagged_for_jerry: boolean
  flag_reason?: string
  tags: string[]
  notes?: string
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AgentQuota {
  id: string
  agent_code: AgentCode
  date: string
  target: number
  completed: number
  status: QuotaStatus
  last_run_at?: string
  run_count: number
  notes?: string
}

export interface AgentActivityLog {
  agent_code: AgentCode
  action: string
  lead_id?: string
  arm?: Arm
  success: boolean
  details?: Record<string, unknown>
  error?: string
}

export interface OutreachRecord {
  email: string
  arm: Arm
  lead_id?: string
  message_type: MessageType
  subject?: string
  body_preview?: string
  provider_message_id?: string
}

export interface PipelineSnapshot {
  arm: Arm
  stages: Record<PipelineStage, number>
  total: number
  hot_leads: PipelineLead[]
  mrr_closed: number
  mrr_projected: number
}

export interface DailyReport {
  report_type: ReportType
  date: string
  yesterday?: DayStats
  today_quota: AgentQuota[]
  pipeline: PipelineSnapshot[]
  hot_leads: PipelineLead[]
  mrr_current: number
  mrr_target: number
  mrr_gap: number
  days_remaining: number
  flags: string[]
}

export interface DayStats {
  leads_found: Record<Arm, number>
  outreach_sent: Record<Arm, number>
  replies_received: Record<Arm, number>
  calls_booked: number
  deals_closed: number
  revenue_closed: number
}

// Stages that need follow-up advancement (in days after last outreach)
export const FOLLOW_UP_ADVANCE_DAYS: Partial<Record<PipelineStage, number>> = {
  OUTREACH_SENT: 3,
  FOLLOW_UP_1: 4,
  FOLLOW_UP_2: 5,
}

export const STAGE_AFTER_FOLLOW_UP: Partial<Record<PipelineStage, PipelineStage>> = {
  OUTREACH_SENT: 'FOLLOW_UP_1',
  FOLLOW_UP_1: 'FOLLOW_UP_2',
  FOLLOW_UP_2: 'FOLLOW_UP_3',
  FOLLOW_UP_3: 'NURTURE_30',
}

export const FOLLOW_UP_MESSAGE_TYPE: Partial<Record<PipelineStage, MessageType>> = {
  FOLLOW_UP_1: 'FOLLOW_UP_1',
  FOLLOW_UP_2: 'FOLLOW_UP_2',
  FOLLOW_UP_3: 'FOLLOW_UP_3',
}

export const REVENUE_TARGET_MONTHLY = 85000
export const REVENUE_TARGET_DAYS = 90
export const TARGET_START_DATE = '2026-06-06'
