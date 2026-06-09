import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PipelineStage } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// PATCH /api/agents/pipeline/[id]
// Move a lead to a new stage, or update any field. Records stage history.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as {
    stage?: PipelineStage
    changed_by?: string
    stage_notes?: string
    flagged_for_jerry?: boolean
    flag_reason?: string
    [key: string]: unknown
  }

  // Get current lead to record stage history
  const { data: current, error: fetchErr } = await supabase
    .from('pipeline_leads')
    .select('stage')
    .eq('id', id)
    .single()

  if (fetchErr) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { changed_by, stage_notes, ...updateFields } = body

  // Set timestamps based on stage transitions
  if (body.stage) {
    const now = new Date().toISOString()
    if (body.stage === 'OUTREACH_SENT' || body.stage.startsWith('FOLLOW_UP')) {
      updateFields.last_outreach_at = now
    }
    if (body.stage === 'REPLIED') updateFields.reply_received_at = now
    if (body.stage === 'CALL_BOOKED') updateFields.call_booked_at = now
    if (body.stage === 'PROPOSED') updateFields.proposal_sent_at = now
    if (body.stage === 'CLOSED_WON') updateFields.closed_at = now
    if (body.stage === 'CLOSED_LOST') updateFields.closed_at = now
    if (body.stage === 'NURTURE_30') {
      const nurture = new Date()
      nurture.setDate(nurture.getDate() + 30)
      updateFields.nurture_until = nurture.toISOString()
    }
  }

  const { data, error } = await supabase
    .from('pipeline_leads')
    .update({ ...updateFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Record stage history if stage changed
  if (body.stage && body.stage !== current.stage) {
    await supabase.from('pipeline_stage_history').insert({
      lead_id: id,
      from_stage: current.stage,
      to_stage: body.stage,
      changed_by: changed_by ?? 'SYSTEM',
      notes: stage_notes,
    })
  }

  return NextResponse.json({ lead: data })
}

// GET /api/agents/pipeline/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data, error } = await supabase.from('pipeline_leads').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead: data })
}

// DELETE /api/agents/pipeline/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await supabase.from('pipeline_leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true, id })
}
