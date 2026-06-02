import { NextResponse } from 'next/server'

export function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json(body, { status })
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status })
}
