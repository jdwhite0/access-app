/**
 * Email delivery — marketing gated via canSendEmail; transactional always attempts send.
 * Set RESEND_API_KEY + EMAIL_FROM for production. Without API key, logs only (dev-safe).
 */

import { canSendEmail } from '@/lib/email/can-send'
import type { SendEmailRequest } from '@/types/email'

export type SendEmailResult =
  | { ok: true; id?: string; mode: 'resend' | 'log' }
  | { ok: false; error: string; skipped?: boolean }

export async function sendAccessEmail(req: SendEmailRequest): Promise<SendEmailResult> {
  const gate = await canSendEmail({
    kind: req.kind,
    category: req.category,
    email: req.to,
    identityId: req.userId ?? null,
  })

  if (!gate.allowed) {
    return { ok: false, error: gate.reason, skipped: true }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim() || 'ACCESS <notifications@access.jd.ai>'

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[email] RESEND_API_KEY missing — email not sent:', req.subject, req.to)
    } else {
      console.info('[email:dev]', { to: req.to, subject: req.subject, kind: req.kind, category: req.category })
    }
    return { ok: true, mode: 'log' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [req.to],
      subject: req.subject,
      html: req.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    return { ok: false, error: text || `Resend HTTP ${res.status}` }
  }

  const json = (await res.json()) as { id?: string }
  return { ok: true, id: json.id, mode: 'resend' }
}
