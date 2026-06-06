import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Arm, MessageType, OutreachRecord } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// GET /api/agents/outreach?email=x@y.com&arm=consulting&type=OUTREACH_1
// Returns { contacted: boolean } — agents use this to skip already-contacted leads.
export async function GET(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const email = searchParams.get('email')?.toLowerCase().trim()
  const arm = searchParams.get('arm') as Arm | null
  const type = searchParams.get('type') as MessageType | null

  if (!email || !arm) {
    return NextResponse.json({ error: 'email and arm required' }, { status: 400 })
  }

  // Also block contacts within 30 days even if message type differs
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let query = supabase
    .from('outreach_history')
    .select('message_type, sent_at')
    .ilike('email', email)
    .eq('arm', arm)
    .gte('sent_at', thirtyDaysAgo.toISOString())

  if (type) query = query.eq('message_type', type)

  const { data } = await query

  const contacted = (data?.length ?? 0) > 0
  const history = data ?? []

  return NextResponse.json({ contacted, history })
}

// POST /api/agents/outreach
// Record that an outreach message was sent. Enforces deduplication.
export async function POST(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as OutreachRecord

  if (!body.email || !body.arm || !body.message_type) {
    return NextResponse.json({ error: 'email, arm, message_type required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('outreach_history')
    .insert({
      ...body,
      email: body.email.toLowerCase().trim(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ duplicate: true, message: 'Already sent this message type to this email' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also increment outreach_count on the lead
  if (body.lead_id) {
    const { data: lead } = await supabase
      .from('pipeline_leads')
      .select('outreach_count')
      .eq('id', body.lead_id)
      .single()

    if (lead) {
      await supabase
        .from('pipeline_leads')
        .update({
          outreach_count: (lead.outreach_count ?? 0) + 1,
          last_outreach_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.lead_id)
    }
  }

  return NextResponse.json({ record: data, logged: true }, { status: 201 })
}
