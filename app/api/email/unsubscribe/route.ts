import { NextResponse } from 'next/server'
import { executeUnsubscribe, previewUnsubscribeToken } from '@/lib/email/unsubscribe-handler'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const preview = previewUnsubscribeToken(token)
  if (!preview) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  return NextResponse.json({ preview })
}

export async function POST(request: Request) {
  let body: { token?: string; scope?: 'category' | 'all_marketing' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const scope = body.scope === 'all_marketing' ? 'all_marketing' : 'category'
  const result = await executeUnsubscribe({
    token: body.token,
    scope,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, email: result.email })
}
