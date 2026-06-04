import { createSupabaseAdmin } from '@/lib/supabase'
import type { EmailQueueStatus, EmailSendQueueRow } from '@/lib/email/agents/types'

export async function insertQueueItem(input: {
  user_id: string | null
  email: string
  email_type: string
  category: string
  subject: string
  preview_text?: string
  html_body: string
  text_body?: string
  scheduled_for: string
  status?: EmailQueueStatus
  blocked_reason?: string
  idempotency_key?: string
  metadata?: Record<string, unknown>
}): Promise<{ row: EmailSendQueueRow | null; error?: string; duplicate?: boolean }> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return { row: null, error: 'Database not configured.' }

  if (input.idempotency_key) {
    const { data: existing } = await supabase
      .from('email_send_queue')
      .select('*')
      .eq('idempotency_key', input.idempotency_key)
      .maybeSingle()
    if (existing) return { row: existing as EmailSendQueueRow, duplicate: true }
  }

  const { data, error } = await supabase
    .from('email_send_queue')
    .insert({
      user_id: input.user_id,
      email: input.email,
      email_type: input.email_type,
      category: input.category,
      subject: input.subject,
      preview_text: input.preview_text ?? null,
      html_body: input.html_body,
      text_body: input.text_body ?? null,
      scheduled_for: input.scheduled_for,
      status: input.status ?? 'queued',
      blocked_reason: input.blocked_reason ?? null,
      idempotency_key: input.idempotency_key ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single()

  if (error) return { row: null, error: error.message }
  return { row: data as EmailSendQueueRow }
}

export async function fetchDueQueueItems(limit = 50): Promise<EmailSendQueueRow[]> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return []

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('email_send_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[email-queue] fetchDueQueueItems:', error.message)
    return []
  }

  return (data ?? []) as EmailSendQueueRow[]
}

export async function countQueuedItems(): Promise<{ due: number; total: number; error?: string }> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return { due: 0, total: 0, error: 'Database not configured.' }

  const now = new Date().toISOString()
  const [dueRes, totalRes] = await Promise.all([
    supabase
      .from('email_send_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')
      .lte('scheduled_for', now),
    supabase
      .from('email_send_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued'),
  ])

  if (dueRes.error || totalRes.error) {
    const msg = dueRes.error?.message ?? totalRes.error?.message ?? 'query failed'
    console.error('[email-queue] countQueuedItems:', msg)
    return { due: 0, total: 0, error: msg }
  }

  return {
    due: dueRes.count ?? 0,
    total: totalRes.count ?? 0,
  }
}

export async function updateQueueStatus(
  id: string,
  patch: Partial<Pick<EmailSendQueueRow, 'status' | 'provider_message_id' | 'blocked_reason'>>
): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return
  await supabase.from('email_send_queue').update(patch).eq('id', id)
}

export async function insertSkippedQueueItem(input: {
  user_id: string | null
  email: string
  email_type: string
  category: string
  subject: string
  blocked_reason: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await insertQueueItem({
    ...input,
    html_body: '<!-- skipped -->',
    scheduled_for: new Date().toISOString(),
    status: 'skipped',
    blocked_reason: input.blocked_reason,
  })
}
