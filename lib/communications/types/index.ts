export type PhoneNumber = '813' | '678' | '407'
export type Department = 'hq' | 'operations' | 'jd-productions' | 'bridge-video' | 'access' | 'regal' | 'media' | 'partnerships'
export type PipelineStage =
  | 'new-inquiry'
  | 'captured'
  | 'qualified'
  | 'priority-scored'
  | 'callback-needed'
  | 'discovery-scheduled'
  | 'proposal-needed'
  | 'proposal-sent'
  | 'follow-up-due'
  | 'won'
  | 'lost'
  | 'dormant'
export type Priority = 'high' | 'medium' | 'low'
export type ServiceLine = 'jd-productions' | 'bridge-video' | 'access' | 'regal'
export type CallIntent = 'new-client' | 'existing-client' | 'vendor-partner' | 'media-inquiry' | 'founder-office'
export type EventType = 'new-call' | 'missed-call' | 'new-text' | 'new-voicemail' | 'sona-summary' | 'call-transcript' | 'new-contact' | 'updated-contact'

export interface QuoWebhookPayload {
  event_type: EventType
  call_id?: string
  from_number: string
  to_number: string
  direction?: 'inbound' | 'outbound'
  duration_seconds?: number
  voicemail_url?: string
  voicemail_transcript?: string
  text_body?: string
  sona_summary?: string
  contact_name?: string
  contact_id?: string
  call_transcript?: string
  timestamp: string
}

export interface Contact {
  id: string
  name: string
  company?: string
  phone: string
  email?: string
  source: string
  tags: string[]
  notes: string
  department?: Department
  first_contacted_at: string
  last_contacted_at: string
  total_interactions: number
}

export interface Lead {
  id: string
  contact_id: string
  name: string
  company?: string
  phone: string
  email?: string
  source: string
  service_requested?: ServiceLine
  business_type?: string
  budget_range?: string
  timeline?: string
  location?: string
  urgency?: 'immediate' | 'soon' | 'planning' | 'unknown'
  decision_maker_status?: 'yes' | 'no' | 'unknown'
  department: Department
  priority: Priority
  priority_score: number
  estimated_value: number
  pipeline_stage: PipelineStage
  assigned_agent?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  contact_id: string
  lead_id?: string
  type: 'call' | 'text' | 'voicemail' | 'email' | 'note'
  direction: 'inbound' | 'outbound'
  summary: string
  duration_seconds?: number
  transcript?: string
  recording_url?: string
  agent_action?: string
  created_at: string
}

export interface Callback {
  id: string
  lead_id: string
  contact_id: string
  name: string
  phone: string
  email?: string
  reason: string
  department: Department
  priority: Priority
  revenue_potential: number
  suggested_script: string
  recommended_action: string
  assigned_to?: string
  due_by: string
  status: 'pending' | 'completed' | 'missed' | 'cancelled'
  follow_up_count: number
  next_follow_up: string
  created_at: string
}

export interface PipelineEntry {
  lead_id: string
  stage: PipelineStage
  entered_at: string
  notes: string
  changed_by: string
}

export interface AgentDecision {
  agent: string
  action: string
  lead_id?: string
  contact_id?: string
  decision: string
  confidence: number
  created_at: string
}

export interface RevenueOpportunity {
  id: string
  lead_id: string
  name: string
  company?: string
  service_line: ServiceLine
  estimated_value: number
  probability: number
  stage: PipelineStage
  expected_close: string
  notes: string
}
