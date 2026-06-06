import { createSupabaseAdmin } from '@/lib/supabase'

export type PendingSlackReview = {
  slack_user_id: string
  channel_id: string
  thread_ts: string
  source_id: string
  json_path: string
  topic: string
  created_at: string
  dossier_json?: string  // full dossier content — survives /tmp clears on restart
}

const reviewKey = (slackUserId: string) => `slack_review:${slackUserId}`

export async function savePendingReview(review: Omit<PendingSlackReview, 'created_at'>): Promise<boolean> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const row = {
    user_id: null,
    email: 'system@access.internal',
    email_type: 'daily_brief',
    category: 'daily_brief',
    subject: '[slack review] pending brief',
    status: 'blocked' as const,
    blocked_reason: 'slack_review_pending',
    idempotency_key: reviewKey(review.slack_user_id),
    scheduled_for: new Date().toISOString(),
    metadata: {
      slack_review: true,
      ...review,
      created_at: new Date().toISOString(),
    },
  }

  const { data: existing } = await supabase
    .from('email_send_queue')
    .select('id')
    .eq('idempotency_key', reviewKey(review.slack_user_id))
    .maybeSingle()

  const { error } = existing?.id
    ? await supabase.from('email_send_queue').update(row).eq('id', existing.id)
    : await supabase.from('email_send_queue').insert(row)

  return !error
}

export async function loadPendingReview(slackUserId: string): Promise<PendingSlackReview | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('email_send_queue')
    .select('metadata')
    .eq('idempotency_key', reviewKey(slackUserId))
    .eq('blocked_reason', 'slack_review_pending')
    .maybeSingle()

  if (!data?.metadata) return null
  const meta = data.metadata as Record<string, unknown>
  if (!meta.source_id || !meta.json_path) return null

  return {
    slack_user_id: String(meta.slack_user_id ?? slackUserId),
    channel_id: String(meta.channel_id ?? ''),
    thread_ts: String(meta.thread_ts ?? ''),
    source_id: String(meta.source_id),
    json_path: String(meta.json_path),
    topic: String(meta.topic ?? meta.source_id),
    created_at: String(meta.created_at ?? ''),
    dossier_json: meta.dossier_json ? String(meta.dossier_json) : undefined,
  }
}

export async function clearPendingReview(slackUserId: string): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return
  await supabase.from('email_send_queue').delete().eq('idempotency_key', reviewKey(slackUserId))
}
