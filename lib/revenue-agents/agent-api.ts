/**
 * Agent API client — all agents call these to interact with the ACCESS pipeline.
 * Uses ACCESS_INTERNAL_KEY for auth.
 */

const API_BASE = process.env.ACCESS_API_URL ?? 'https://app-iota-inky-62.vercel.app'
const AUTH_HEADER = { 'x-agent-key': process.env.ACCESS_INTERNAL_KEY ?? '', 'Content-Type': 'application/json' }

interface LeadInput {
  arm: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  title?: string
  website?: string
  linkedin_url?: string
  industry?: string
  location?: string
  icp_score: number
  icp_notes?: string
  source_agent: string
  source_url?: string
  tags?: string[]
  estimated_value?: number
  raw_data?: Record<string, unknown>
}

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...AUTH_HEADER, ...(options.headers as Record<string, string> ?? {}) },
    })
    const data = await res.json() as T & { error?: string }
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─── Pipeline ────────────────────────────────────────────────────────

export async function getPipelineLeads(arm: string, stage?: string, limit = 20) {
  const params = new URLSearchParams({ arm, ...(stage ? { stage } : {}), limit: String(limit) })
  return apiFetch<{ leads: unknown[]; count: number }>(`/api/agents/pipeline?${params}`)
}

export async function addPipelineLead(lead: LeadInput) {
  return apiFetch<{ lead: { id: string }; created: boolean; duplicate?: boolean }>('/api/agents/pipeline', {
    method: 'POST',
    body: JSON.stringify(lead),
  })
}

export async function updateLeadStage(leadId: string, stage: string, notes?: string) {
  return apiFetch<{ lead: { id: string } }>(`/api/agents/pipeline/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, changed_by: 'AGENT', stage_notes: notes ?? '' }),
  })
}

// ─── Quota ────────────────────────────────────────────────────────────

export async function getQuota(agent: string) {
  return apiFetch<{ quota: { target: number; completed: number }; remaining: number }>(`/api/agents/quota?agent=${agent}`)
}

export async function updateQuota(agent: string, increment: number, notes?: string) {
  return apiFetch<{ quota: { target: number; completed: number }; remaining: number }>('/api/agents/quota', {
    method: 'PATCH',
    body: JSON.stringify({ agent, increment, notes }),
  })
}

// ─── Activity Log ────────────────────────────────────────────────────

export async function logActivity(entry: {
  agent_code: string
  action: string
  lead_id?: string
  arm?: string
  success: boolean
  details?: Record<string, unknown>
  error?: string
}) {
  return apiFetch('/api/agents/log', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export async function logActivityBatch(entries: {
  agent_code: string; action: string; lead_id?: string; arm?: string; success: boolean; details?: Record<string, unknown>; error?: string
}[]) {
  return apiFetch('/api/agents/log', {
    method: 'POST',
    body: JSON.stringify({ batch: entries }),
  })
}

// ─── Outreach (dedup) ────────────────────────────────────────────

export async function checkOutreachDedup(email: string, arm: string, type?: string) {
  const params = new URLSearchParams({ email, arm, ...(type ? { type } : {}) })
  return apiFetch<{ contacted: boolean; last_message_type?: string }>(`/api/agents/outreach?${params}`)
}

export async function recordOutreach(entry: {
  email: string; arm: string; lead_id?: string; message_type: string; subject?: string; body_preview?: string
}) {
  return apiFetch('/api/agents/outreach', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

// ─── Send Email ──────────────────────────────────────────────────────

export async function sendAgentEmail(input: {
  to: string; subject: string; body: string; arm: string; lead_id?: string; message_type: string; from_name?: string
}) {
  const isMock = process.env.MOCK_MODE === 'true'
  return apiFetch<{ ok: boolean; message_id?: string }>('/api/agents/send-email', {
    method: 'POST',
    body: JSON.stringify({ ...input, mock: isMock }),
  })
}
