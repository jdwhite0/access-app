import { NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe/actions'

export async function POST() {
  const result = await createPortalSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ url: result.url })
}
