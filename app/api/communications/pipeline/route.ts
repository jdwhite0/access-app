import { NextRequest, NextResponse } from 'next/server'
import { getStore, loadStoreFromSupabase, flushWrites } from '@/lib/communications/integrations/store'
import { intakeNewLead, qualifyLead, setPriority } from '@/lib/communications/agents/lead-intake'
import { advanceStage } from '@/lib/communications/services/pipeline'

export async function GET(req: NextRequest) {
  await loadStoreFromSupabase()
  const stage = req.nextUrl.searchParams.get('stage')
  const department = req.nextUrl.searchParams.get('department')
  const store = getStore()
  let leads = store.leads

  if (stage) leads = leads.filter(l => l.pipeline_stage === stage)
  if (department) leads = leads.filter(l => l.department === department)

  return NextResponse.json({
    leads,
    callbackCount: store.callbacks.length,
    pipelineValue: store.opportunities.reduce((s, o) => s + o.estimated_value, 0),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    await loadStoreFromSupabase()
    let result: any = null

    switch (action) {
      case 'intake': {
        const res = intakeNewLead(body.input)
        result = res.lead
        break
      }
      case 'qualify': {
        result = qualifyLead(body.lead_id, body.updates)
        if (!result) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        break
      }
      case 'score': {
        result = setPriority(body.lead_id)
        if (!result) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        break
      }
      case 'advance': {
        const lead = getStore().leads.find(l => l.id === body.lead_id)
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        result = advanceStage(lead, body.stage, body.changed_by ?? 'api')
        if (!result) return NextResponse.json({ error: 'Cannot advance to previous stage' }, { status: 400 })
        break
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    await flushWrites()
    return NextResponse.json({ ok: true, lead: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
