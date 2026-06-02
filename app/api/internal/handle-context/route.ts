import { NextRequest, NextResponse } from 'next/server'
import { buildAccessHandleContext } from '@/lib/access-handle/build-handle-context'
import { PRIMARY_TEST_HANDLE } from '@/lib/access-handle/constants'

/**
 * Internal handle-bound context for JYSON bridge (P6 alignment).
 * Not public chat — system-to-system context export.
 */
export async function GET(request: NextRequest) {
  const key = request.headers.get('x-access-internal-key')
  const expected = process.env.ACCESS_INTERNAL_KEY
  if (expected && key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!expected && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'ACCESS_INTERNAL_KEY required in production' },
      { status: 503 }
    )
  }

  const handle =
    request.nextUrl.searchParams.get('handle')?.trim() || PRIMARY_TEST_HANDLE

  const { context, error } = await buildAccessHandleContext(handle)
  if (!context) {
    return NextResponse.json({ error: error ?? 'Context not found' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    ownershipAnchor: context.ownershipAnchor,
    context,
  })
}
