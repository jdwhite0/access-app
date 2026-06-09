import type { Lead, Callback } from '../types'
import { createCallback, advanceFollowUp } from '../services/callback-engine'
import { alertCallback, alertFounder } from '../integrations/slack'
import { getStore } from '../integrations/store'

export function handleCallbackNeeded(leadId: string): Callback | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null

  const callback = createCallback(lead)
  alertCallback(callback)

  if (lead.priority === 'high') {
    alertFounder(`🔥 *High-priority callback needed*\n${lead.name} — ${lead.company ?? ''} — $${lead.estimated_value.toLocaleString()}\nPhone: ${lead.phone}\nScript: ${callback.suggested_script}`)
  }

  return callback
}

export function getDueCallbacks(): Callback[] {
  return getStore().callbacks.filter(c => c.status === 'pending' && c.due_by <= new Date().toISOString())
}

export function getOverdueCallbacks(): Callback[] {
  const now = new Date()
  return getStore().callbacks.filter(c => {
    if (c.status !== 'pending') return false
    const due = new Date(c.due_by)
    return now.getTime() - due.getTime() > 24 * 60 * 60 * 1000
  })
}

export function completeCallback(callbackId: string): boolean {
  const cb = getStore().callbacks.find(c => c.id === callbackId)
  if (!cb) return false
  cb.status = 'completed'
  return true
}

export function processFollowUpCadence(callbackId: string): Callback | null {
  return advanceFollowUp(callbackId)
}

export function getCallbackScript(callback: Callback): string {
  return callback.suggested_script
}
