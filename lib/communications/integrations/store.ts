import type { Contact, Lead, Interaction, Callback, PipelineEntry, RevenueOpportunity } from '../types'
import { createSupabaseAdmin } from '../../supabase'

// In-memory arrays (cache)
const contacts: Contact[] = []
const leads: Lead[] = []
const interactions: Interaction[] = []
const callbacks: Callback[] = []
const pipeline: PipelineEntry[] = []
const opportunities: RevenueOpportunity[] = []

// Dirty sets to track mutations within a request
let dirtyLeadIds = new Set<string>()
let dirtyContactIds = new Set<string>()
let dirtyPipelineEntries: PipelineEntry[] = []

// Helper to map Comms OS stages to pipeline_leads stages (respecting check constraints)
function mapCommsStageToPipelineLeads(stage: string): string {
  switch (stage) {
    case 'new-inquiry':
    case 'captured':
      return 'IDENTIFIED'
    case 'qualified':
    case 'priority-scored':
      return 'SCORED'
    case 'callback-needed':
    case 'discovery-scheduled':
    case 'proposal-needed':
    case 'follow-up-due':
      return 'QUEUED'
    case 'proposal-sent':
      return 'PROPOSED'
    case 'won':
      return 'CLOSED_WON'
    case 'lost':
      return 'CLOSED_LOST'
    case 'dormant':
      return 'NURTURE_30'
    default:
      return 'IDENTIFIED'
  }
}

// Helper to map pipeline_leads stages to Comms OS stages
function mapPipelineLeadsStageToComms(stage: string): string {
  switch (stage) {
    case 'IDENTIFIED':
      return 'captured'
    case 'SCORED':
      return 'priority-scored'
    case 'QUEUED':
    case 'OUTREACH_SENT':
    case 'FOLLOW_UP_1':
    case 'FOLLOW_UP_2':
    case 'FOLLOW_UP_3':
      return 'callback-needed'
    case 'REPLIED':
      return 'qualified'
    case 'CALL_BOOKED':
      return 'discovery-scheduled'
    case 'PROPOSED':
      return 'proposal-sent'
    case 'CLOSED_WON':
      return 'won'
    case 'CLOSED_LOST':
      return 'lost'
    case 'NURTURE_30':
      return 'dormant'
    default:
      return 'captured'
  }
}

/**
 * Load all store data from Supabase into the local memory cache.
 * Call this at the start of Next.js API requests.
 */
export async function loadStoreFromSupabase(): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    console.warn('[store] Supabase not configured — operating in memory-only mode')
    return
  }

  // Clear in-memory cache
  contacts.length = 0
  leads.length = 0
  interactions.length = 0
  callbacks.length = 0
  pipeline.length = 0
  opportunities.length = 0

  dirtyLeadIds.clear()
  dirtyContactIds.clear()
  dirtyPipelineEntries = []

  // 1. Load leads and contacts from pipeline_leads
  const { data: dbLeads, error: leadsErr } = await supabase
    .from('pipeline_leads')
    .select('*')
  
  if (leadsErr) {
    console.error('[store] Error loading pipeline_leads:', leadsErr.message)
    return
  }

  if (dbLeads) {
    for (const row of dbLeads) {
      const raw = row.raw_data || {}
      
      // Determine if this row represents a contact-only or a full lead
      if (raw.is_contact_only === true) {
        const contact: Contact = {
          id: row.id,
          name: row.first_name + (row.last_name ? ' ' + row.last_name : ''),
          company: row.company || undefined,
          phone: raw.phone || '',
          email: row.email && !row.email.endsWith('@no-email.com') && !row.email.endsWith('@placeholder.com') ? row.email : undefined,
          source: row.source_agent || 'unknown',
          tags: row.tags || [],
          notes: row.notes || '',
          department: raw.department || undefined,
          first_contacted_at: row.created_at,
          last_contacted_at: row.last_outreach_at || row.updated_at,
          total_interactions: row.outreach_count || 0,
        }
        contacts.push(contact)
      } else {
        // Full Lead
        const lead: Lead = {
          id: row.id,
          contact_id: raw.contact_id || row.id,
          name: row.first_name + (row.last_name ? ' ' + row.last_name : ''),
          company: row.company || undefined,
          phone: raw.phone || '',
          email: row.email && !row.email.endsWith('@no-email.com') && !row.email.endsWith('@placeholder.com') ? row.email : undefined,
          source: row.source_agent || 'website-contact',
          service_requested: row.arm as any,
          business_type: row.industry || undefined,
          budget_range: raw.budget_range || undefined,
          timeline: raw.timeline || undefined,
          location: row.location || undefined,
          urgency: raw.urgency || 'unknown',
          decision_maker_status: raw.decision_maker_status || 'unknown',
          department: raw.department || 'hq',
          priority: raw.priority || 'medium',
          priority_score: row.icp_score ? row.icp_score * 10 : 50,
          estimated_value: Number(row.proposal_amount || row.closed_value || 0),
          pipeline_stage: mapPipelineLeadsStageToComms(row.stage) as any,
          assigned_agent: row.source_agent || undefined,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
        leads.push(lead)

        // Also add as a contact so relation lookups succeed
        const contact: Contact = {
          id: lead.contact_id,
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          tags: row.tags || [],
          notes: row.notes || '',
          department: lead.department,
          first_contacted_at: lead.created_at,
          last_contacted_at: lead.updated_at,
          total_interactions: row.outreach_count || 0,
        }
        if (!contacts.find(c => c.id === contact.id)) {
          contacts.push(contact)
        }
      }

      // Load nested interactions
      if (Array.isArray(raw.interactions)) {
        interactions.push(...raw.interactions)
      }

      // Load nested callbacks
      if (Array.isArray(raw.callbacks)) {
        callbacks.push(...raw.callbacks)
      }

      // Load nested opportunities
      if (raw.opportunity) {
        opportunities.push(raw.opportunity)
      }
    }
  }

  // 2. Load pipeline stage history from pipeline_stage_history
  const { data: dbHistory, error: historyErr } = await supabase
    .from('pipeline_stage_history')
    .select('*')
  
  if (historyErr) {
    console.error('[store] Error loading pipeline_stage_history:', historyErr.message)
    return
  }

  if (dbHistory) {
    for (const row of dbHistory) {
      pipeline.push({
        lead_id: row.lead_id,
        stage: mapPipelineLeadsStageToComms(row.to_stage) as any,
        entered_at: row.created_at,
        notes: row.notes || '',
        changed_by: row.changed_by || 'system',
      })
    }
  }
}

/**
 * Flush all pending mutations to the Supabase database.
 * Call this at the end of Next.js API requests.
 */
export async function flushWrites(): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return

  const now = new Date().toISOString()

  // 1. Process dirty contacts
  for (const id of dirtyContactIds) {
    const c = contacts.find(item => item.id === id)
    if (!c) continue

    const names = c.name.split(' ')
    const firstName = names[0] || 'Unknown'
    const lastName = names.slice(1).join(' ')
    const email = c.email?.trim() || `phone_${c.phone.replace(/[^0-9]/g, '')}@no-email.com`
    const arm = c.department || 'access'

    // Deduplicate against existing (lower(email), arm) to prevent constraint failure
    let resolvedId = c.id
    const { data: existing } = await supabase
      .from('pipeline_leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('arm', arm)
      .maybeSingle()

    if (existing) {
      resolvedId = existing.id
    }

    const cInteractions = interactions.filter(i => i.contact_id === c.id)

    await supabase.from('pipeline_leads').upsert({
      id: resolvedId,
      first_name: firstName,
      last_name: lastName || null,
      email,
      company: c.company || null,
      arm,
      stage: 'IDENTIFIED',
      source_agent: c.source,
      tags: c.tags,
      notes: c.notes || null,
      outreach_count: c.total_interactions,
      raw_data: {
        ...c,
        id: resolvedId,
        is_contact_only: true,
        interactions: cInteractions,
      },
      updated_at: now,
    }, { onConflict: 'id' })
  }

  // 2. Process dirty leads
  for (const id of dirtyLeadIds) {
    const l = leads.find(item => item.id === id)
    if (!l) continue

    const names = l.name.split(' ')
    const firstName = names[0] || 'Unknown'
    const lastName = names.slice(1).join(' ')
    const email = l.email?.trim() || `lead_${l.id}@no-email.com`
    const arm = l.service_requested || 'access'

    // Deduplicate against existing (lower(email), arm) to prevent constraint failure
    let resolvedId = l.id
    const { data: existing } = await supabase
      .from('pipeline_leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('arm', arm)
      .maybeSingle()

    if (existing) {
      resolvedId = existing.id
    }

    const lCallbacks = callbacks.filter(cb => cb.lead_id === l.id)
    const lInteractions = interactions.filter(i => i.lead_id === l.id || i.contact_id === l.contact_id)
    const lOpportunity = opportunities.find(o => o.lead_id === l.id)

    // Stage mapped
    const stage = mapCommsStageToPipelineLeads(l.pipeline_stage)

    await supabase.from('pipeline_leads').upsert({
      id: resolvedId,
      first_name: firstName,
      last_name: lastName || null,
      email,
      company: l.company || null,
      arm,
      stage,
      location: l.location || null,
      icp_score: Math.max(1, Math.min(10, Math.floor(l.priority_score / 10))),
      source_agent: l.assigned_agent || 'MANUAL',
      proposal_amount: lOpportunity?.estimated_value || l.estimated_value || null,
      raw_data: {
        ...l,
        id: resolvedId,
        is_contact_only: false,
        callbacks: lCallbacks,
        interactions: lInteractions,
        opportunity: lOpportunity,
      },
      updated_at: now,
    }, { onConflict: 'id' })
  }

  // 3. Process dirty pipeline history entries
  if (dirtyPipelineEntries.length > 0) {
    const insertHistory = dirtyPipelineEntries.map(e => ({
      lead_id: e.lead_id,
      from_stage: null,
      to_stage: mapCommsStageToPipelineLeads(e.stage),
      changed_by: e.changed_by,
      notes: e.notes || null,
      created_at: e.entered_at,
    }))

    await supabase.from('pipeline_stage_history').insert(insertHistory)
  }

  // Clear dirty sets after successful flush
  dirtyLeadIds.clear()
  dirtyContactIds.clear()
  dirtyPipelineEntries = []
}

// ─── Exported Interface ───

export function getStore() {
  return { contacts, leads, interactions, callbacks, pipeline, opportunities }
}

export function resetStore() {
  contacts.length = 0
  leads.length = 0
  interactions.length = 0
  callbacks.length = 0
  pipeline.length = 0
  opportunities.length = 0

  dirtyLeadIds.clear()
  dirtyContactIds.clear()
  dirtyPipelineEntries = []
}

export function addContact(c: Contact): Contact {
  const existingIdx = contacts.findIndex(item => item.id === c.id)
  if (existingIdx >= 0) {
    contacts[existingIdx] = c
  } else {
    contacts.push(c)
  }
  dirtyContactIds.add(c.id)
  return c
}

export function getContact(id: string): Contact | undefined {
  return contacts.find(c => c.id === id)
}

export function getContactByPhone(phone: string): Contact | undefined {
  return contacts.find(c => c.phone === phone)
}

export function updateContact(id: string, updates: Partial<Contact>): Contact | undefined {
  const c = getContact(id)
  if (!c) return undefined
  Object.assign(c, updates)
  dirtyContactIds.add(id)
  return c
}

export function addLead(l: Lead): Lead {
  const existingIdx = leads.findIndex(item => item.id === l.id)
  if (existingIdx >= 0) {
    leads[existingIdx] = l
  } else {
    leads.push(l)
  }
  dirtyLeadIds.add(l.id)
  return l
}

export function getLead(id: string): Lead | undefined {
  return leads.find(l => l.id === id)
}

export function getLeadsByStage(stage: string): Lead[] {
  return leads.filter(l => l.pipeline_stage === stage)
}

export function getHighPriorityLeads(): Lead[] {
  return leads.filter(l => l.priority === 'high')
}

export function getLeadsByDepartment(dept: string): Lead[] {
  return leads.filter(l => l.department === dept)
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | undefined {
  const l = getLead(id)
  if (!l) return undefined
  Object.assign(l, updates, { updated_at: new Date().toISOString() })
  dirtyLeadIds.add(id)
  return l
}

export function addInteraction(i: Interaction): Interaction {
  interactions.push(i)
  if (i.lead_id) {
    dirtyLeadIds.add(i.lead_id)
  } else if (i.contact_id) {
    dirtyContactIds.add(i.contact_id)
  }
  return i
}

export function getContactInteractions(contactId: string): Interaction[] {
  return interactions.filter(i => i.contact_id === contactId).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function addCallback(c: Callback): Callback {
  const existingIdx = callbacks.findIndex(item => item.id === c.id)
  if (existingIdx >= 0) {
    callbacks[existingIdx] = c
  } else {
    callbacks.push(c)
  }
  dirtyLeadIds.add(c.lead_id)
  return c
}

export function getCallbacksDue(): Callback[] {
  return callbacks.filter(c => c.status === 'pending' && c.due_by <= new Date().toISOString())
}

export function getCallbacksByLead(leadId: string): Callback[] {
  return callbacks.filter(c => c.lead_id === leadId)
}

export function updateCallback(id: string, updates: Partial<Callback>): Callback | undefined {
  const c = callbacks.find(cb => cb.id === id)
  if (!c) return undefined
  Object.assign(c, updates)
  dirtyLeadIds.add(c.lead_id)
  return c
}

export function addPipelineEntry(e: PipelineEntry): PipelineEntry {
  pipeline.push(e)
  dirtyPipelineEntries.push(e)
  dirtyLeadIds.add(e.lead_id)
  return e
}

export function getLeadPipeline(leadId: string): PipelineEntry[] {
  return pipeline.filter(e => e.lead_id === leadId).sort((a, b) => b.entered_at.localeCompare(a.entered_at))
}

export function addOpportunity(o: RevenueOpportunity): RevenueOpportunity {
  const existingIdx = opportunities.findIndex(item => item.id === o.id)
  if (existingIdx >= 0) {
    opportunities[existingIdx] = o
  } else {
    opportunities.push(o)
  }
  dirtyLeadIds.add(o.lead_id)
  return o
}

export function getPipelineValue(): { total: number; weighted: number } {
  const total = opportunities.reduce((s, o) => s + o.estimated_value, 0)
  const weighted = opportunities.reduce((s, o) => s + (o.estimated_value * o.probability), 0)
  return { total, weighted }
}

export function getClosedRevenue(): number {
  return opportunities.filter(o => o.stage === 'won').reduce((s, o) => s + o.estimated_value, 0)
}
