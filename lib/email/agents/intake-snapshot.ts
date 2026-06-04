import { createSupabaseAdmin } from '@/lib/supabase'
import type { EmailIntakePayload } from '@/lib/email/agents/types'

/** Stable idempotency key — one row holds latest daily-brief intake for Vercel cron. */
export const DAILY_BRIEF_SNAPSHOT_KEY = 'intake_snapshot:daily_brief_latest'

export type PublishedIntakeSnapshot = {
  intake: EmailIntakePayload
  dossier_path?: string
  published_at?: string
}

export async function publishDailyBriefSnapshot(input: {
  intake: EmailIntakePayload
  dossier_path?: string
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return { ok: false, error: 'supabase_not_configured' }

  const published_at = new Date().toISOString()
  const row = {
    user_id: null,
    email: 'system@access.internal',
    email_type: 'daily_brief',
    category: 'daily_brief',
    subject: '[intake snapshot] daily brief',
    status: 'blocked',
    blocked_reason: 'intake_snapshot',
    idempotency_key: DAILY_BRIEF_SNAPSHOT_KEY,
    scheduled_for: published_at,
    metadata: {
      snapshot: true,
      intake: input.intake,
      dossier_path: input.dossier_path ?? input.intake.source_path ?? null,
      published_at,
    },
  }

  const { data: existing } = await supabase
    .from('email_send_queue')
    .select('id')
    .eq('idempotency_key', DAILY_BRIEF_SNAPSHOT_KEY)
    .maybeSingle()

  const { error } = existing?.id
    ? await supabase.from('email_send_queue').update(row).eq('id', existing.id)
    : await supabase.from('email_send_queue').insert(row)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchDailyBriefSnapshot(): Promise<PublishedIntakeSnapshot | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('email_send_queue')
    .select('metadata, updated_at')
    .eq('idempotency_key', DAILY_BRIEF_SNAPSHOT_KEY)
    .maybeSingle()

  if (error || !data?.metadata) return null

  const meta = data.metadata as Record<string, unknown>
  const intake = meta.intake as EmailIntakePayload | undefined
  if (!intake?.source_type || !intake.payload) return null

  return {
    intake,
    dossier_path: typeof meta.dossier_path === 'string' ? meta.dossier_path : undefined,
    published_at:
      typeof meta.published_at === 'string'
        ? meta.published_at
        : typeof data.updated_at === 'string'
          ? data.updated_at
          : undefined,
  }
}
