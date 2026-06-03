import { NextResponse } from 'next/server'
import { getIdentityPlan } from '@/lib/stripe/get-identity-plan'

export async function GET() {
  const result = await getIdentityPlan()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }
  return NextResponse.json({ plan: result.data.plan })
}
