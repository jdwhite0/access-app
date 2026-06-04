/**
 * Transactional send helpers — bypass marketing preference toggles.
 * Still respect product need; never use for promotional content.
 */

import { sendAccessEmail } from '@/lib/email/sender'
import { renderConnectorOfflineAlertEmail } from '@/lib/email/templates/connector-offline'
import { renderSyncFailureAlertEmail } from '@/lib/email/templates/sync-failure'

export async function sendConnectorOfflineAlert(input: {
  email: string
  identityId?: string
  handle: string
  deviceName: string
  lastSeen: string
}) {
  const { subject, html } = renderConnectorOfflineAlertEmail(input)
  return sendAccessEmail({
    to: input.email,
    subject,
    html,
    kind: 'transactional',
    category: 'connector_offline',
    userId: input.identityId,
  })
}

export async function sendSyncFailureAlert(input: {
  email: string
  identityId?: string
  handle: string
  vaultName: string
  errorSummary: string
}) {
  const { subject, html } = renderSyncFailureAlertEmail(input)
  return sendAccessEmail({
    to: input.email,
    subject,
    html,
    kind: 'transactional',
    category: 'sync_failure',
    userId: input.identityId,
  })
}
