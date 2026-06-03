import { NextRequest, NextResponse } from 'next/server'
import { createEmbeddedCheckoutSession } from '@/lib/stripe/actions'
import type { EmbeddedCheckoutPlan } from '@/lib/stripe/actions'
import type { BillingInterval } from '@/lib/stripe/prices'

const VALID: EmbeddedCheckoutPlan[] = ['operator', 'builder']

function parseInterval(value: unknown): BillingInterval {
  return value === 'year' ? 'year' : 'month'
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    plan?: EmbeddedCheckoutPlan
    interval?: BillingInterval
  }
  const { plan, interval: rawInterval } = body
  if (!plan || !VALID.includes(plan)) {
    return NextResponse.json({ error: 'plan must be operator or builder' }, { status: 400 })
  }

  const interval = parseInterval(rawInterval)
  const result = await createEmbeddedCheckoutSession(plan, interval)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ clientSecret: result.clientSecret })
}
