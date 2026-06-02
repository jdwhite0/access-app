import { NextRequest, NextResponse } from 'next/server'
import { buildAccessHandleContext } from '@/lib/access-handle/build-handle-context'
import { PRIMARY_TEST_HANDLE } from '@/lib/access-handle/constants'
import { classifiedErrorResponse } from '@/lib/api/platform-response'

/**
 * Internal handle-bound context for JYSON bridge (P6 alignment).
 * Not public chat — system-to-system context export.
 */
export async function GET(request: NextRequest) {
  const key = request.headers.get('x-access-internal-key')
  const expected = process.env.ACCESS_INTERNAL_KEY
  if (expected && key !== expected) {
    return classifiedErrorResponse(
      { message: 'Unauthorized.', httpStatus: 401, product: 'access_os', service: 'auth' },
      { httpStatus: 401, audience: 'internal_engineering' }
    )
  }
  if (!expected && process.env.NODE_ENV === 'production') {
    return classifiedErrorResponse(
      { message: 'ACCESS_INTERNAL_KEY not configured.', product: 'access_os', service: 'configuration' },
      { httpStatus: 503, audience: 'internal_engineering' }
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
