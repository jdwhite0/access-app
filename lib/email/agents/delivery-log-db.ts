import { createSupabaseAdmin } from '@/lib/supabase'
import type { EmailDeliveryLogRow, EmailDeliveryStatus } from '@/lib/email/agents/types'

export async function logEmailDelivery(input: {
  send_queue_id?: string | null
  user_id?: string | null
  email: string
  email_type?: string
  category?: string
  status: EmailDeliveryStatus
  provider_message_id?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown>
}): Promise<EmailDeliveryLogRow | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('email_delivery_logs')
    .insert({
      send_queue_id: input.send_queue_id ?? null,
      user_id: input.user_id ?? null,
      email: input.email,
      email_type: input.email_type ?? null,
      category: input.category ?? null,
      status: input.status,
      provider_message_id: input.provider_message_id ?? null,
      error_message: input.error_message ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single()

  if (error?.message?.includes('email_delivery_logs_user_id_fkey') && input.user_id) {
    return logEmailDelivery({ ...input, user_id: null })
  }

  if (error) {
    console.warn('[delivery-log]', error.message)
    return null
  }
  return data as EmailDeliveryLogRow
}
