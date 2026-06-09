import { NextRequest, NextResponse } from 'next/server'
import { generateFounderBrief } from '@/lib/communications/agents/founder-briefing'
import { getStore, getPipelineValue, getClosedRevenue, loadStoreFromSupabase } from '@/lib/communications/integrations/store'

export async function GET(req: NextRequest) {
  await loadStoreFromSupabase()
  const type = req.nextUrl.searchParams.get('type') ?? 'brief'

  switch (type) {
    case 'brief': {
      const brief = generateFounderBrief()
      return NextResponse.json(brief)
    }
    case 'pipeline': {
      const store = getStore()
      const pv = getPipelineValue()
      const closed = getClosedRevenue()
      return NextResponse.json({
        totalLeads: store.leads.length,
        byStage: store.leads.reduce((acc: Record<string, number>, l) => {
          acc[l.pipeline_stage] = (acc[l.pipeline_stage] ?? 0) + 1
          return acc
        }, {}),
        byPriority: store.leads.reduce((acc: Record<string, number>, l) => {
          acc[l.priority] = (acc[l.priority] ?? 0) + 1
          return acc
        }, {}),
        pipelineValue: pv,
        closedRevenue: closed,
        callbacksPending: store.callbacks.filter(c => c.status === 'pending').length,
        callbacksOverdue: store.callbacks.filter(c => c.status === 'pending' && new Date(c.due_by) < new Date()).length,
      })
    }
    case 'contacts': {
      const store = getStore()
      return NextResponse.json({
        contacts: store.contacts,
        interactions: store.interactions.slice(0, 50),
        totalInteractions: store.interactions.length,
      })
    }
    default:
      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  }
}
