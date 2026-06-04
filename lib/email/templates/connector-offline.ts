import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

/** Transactional — bypasses marketing preferences; no marketing footer category. */
export function renderConnectorOfflineAlertEmail(input: {
  handle: string
  deviceName: string
  lastSeen: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const bodyHtml = `
    <p style="margin:0 0 16px;">Your connector <strong>${input.deviceName}</strong> for <strong>${input.handle}</strong> appears offline.</p>
    ${cardBlock('Last heartbeat', input.lastSeen)}
    <p style="margin:0;font-size:14px;color:#8b92a8;">This alert is required for sync reliability. Check the connector process on your machine.</p>
  `

  return {
    subject: `ACCESS Alert — Connector offline (${input.deviceName})`,
    html: renderAccessEmailHtml({
      title: 'Connector offline',
      bodyHtml,
      cta: { label: 'Open diagnostics', href: `${base}/companion#diagnostics` },
    }),
  }
}
