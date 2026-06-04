import { NextRequest, NextResponse } from 'next/server'
import { assertInternalEmailAuth } from '@/lib/email/agents/config'

/** Vercel Cron: Authorization: Bearer CRON_SECRET. Also accepts x-internal-email-secret. */
export function verifyCronOrInternalAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (cronSecret && bearer === cronSecret) return null

  const internal = request.headers.get('x-internal-email-secret')
  if (assertInternalEmailAuth(internal)) return null

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
