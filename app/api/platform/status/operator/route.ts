import { NextResponse } from 'next/server'
import { requireClerkOperator } from '@/lib/platform-api/auth'
import { buildCommandCenterBundle } from '@/lib/command-center/build-bundle'
import { projectOperatorStatus } from '@/lib/status-page/project-audience-view'
import { publishConsumerStatusPayload } from '@/lib/status-page/consumer-cache'
import {
  projectConsumerStatus,
  assertConsumerPayloadSafe,
} from '@/lib/status-page/project-audience-view'

/**
 * Operator status — inherits Command Center bundle (no full recommendation detail).
 * GET /api/platform/status/operator
 */
export async function GET() {
  const authResult = await requireClerkOperator()
  if (!authResult.ok) return authResult.response

  const bundle = buildCommandCenterBundle()
  const consumer = projectConsumerStatus(bundle)
  const issues = assertConsumerPayloadSafe(consumer)
  if (issues.length === 0) publishConsumerStatusPayload(consumer)

  const payload = projectOperatorStatus(bundle)
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
