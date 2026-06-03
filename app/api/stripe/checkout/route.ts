import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/actions'
import type { StripePlan } from '@/lib/stripe/client'

export async function POST(req: NextRequest) {
  const { plan } = (await req.json()) as { plan?: StripePlan }
  if (!plan) return NextResponse.json({ error: 'plan is required' }, { status: 400 })

  const result = await createCheckoutSession(plan)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ url: result.url })
}
