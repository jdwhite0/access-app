import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Arm, PipelineStage, PipelineLead } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// GET /api/agents/pipeline?arm=consulting&stage=QUEUED&limit=20
// Returns leads for the given arm/stage. Agents read this to know their work queue.
export async function GET(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const arm = searchParams.get('arm') as Arm | null
  const stage = searchParams.get('stage') as PipelineStage | null
  const flagged = searchParams.get('flagged')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  let query = supabase.from('pipeline_leads').select('*').order('created_at', { ascending: true }).limit(limit)

  if (arm) query = query.eq('arm', arm)
  if (stage) query = query.eq('stage', stage)
  if (flagged === 'true') query = query.eq('flagged_for_jerry', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data as PipelineLead[], count: data?.length ?? 0 })
}

// POST /api/agents/pipeline
// Add a new lead. Duplicate email+arm is silently ignored (returns existing).
export async function POST(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Partial<PipelineLead> & { estimated_value?: number }

  if (!body.email || !body.arm) {
    return NextResponse.json({ error: 'email and arm are required' }, { status: 400 })
  }

  if (body.icp_score && body.icp_score < 7) {
    return NextResponse.json({ error: 'Lead score below minimum (7). Not added.', skipped: true }, { status: 200 })
  }

  const normalizedEmail = body.email.toLowerCase().trim()

  // Check for existing lead
  const { data: existing } = await supabase
    .from('pipeline_leads')
    .select('id, stage, icp_score')
    .eq('arm', body.arm)
    .ilike('email', normalizedEmail)
    .single()

  if (existing) {
    return NextResponse.json({ lead: existing, duplicate: true, message: 'Lead already in pipeline' })
  }

  const stage: PipelineStage = (body.icp_score ?? 0) >= 7 ? 'QUEUED' : 'SCORED'

  const { estimated_value: _ev, ...cleanBody } = body

  const { data, error } = await supabase
    .from('pipeline_leads')
    .insert({
      ...cleanBody,
      email: normalizedEmail,
      stage,
      outreach_count: 0,
      flagged_for_jerry: false,
      tags: body.tags ?? [],
      raw_data: { ...body.raw_data ?? {}, estimated_value: _ev },
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violation = duplicate
    if (error.code === '23505') {
      return NextResponse.json({ duplicate: true, message: 'Already exists' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log stage history
  await supabase.from('pipeline_stage_history').insert({
    lead_id: data.id,
    from_stage: null,
    to_stage: stage,
    changed_by: body.source_agent ?? 'MANUAL',
    notes: `Lead added with ICP score ${body.icp_score ?? 'unscored'}`,
  })

  return NextResponse.json({ lead: data, created: true }, { status: 201 })
}
