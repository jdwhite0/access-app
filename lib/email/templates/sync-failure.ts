import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

/** Transactional — bypasses marketing preferences. */
export function renderSyncFailureAlertEmail(input: {
  handle: string
  vaultName: string
  errorSummary: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const bodyHtml = `
    <p style="margin:0 0 16px;">A sync failure was detected for vault <strong>${input.vaultName}</strong> on <strong>${input.handle}</strong>.</p>
    ${cardBlock('Error', input.errorSummary)}
    <p style="margin:0;font-size:14px;color:#8b92a8;">Required product alert — not affected by marketing email preferences.</p>
  `

  return {
    subject: `ACCESS Alert — Sync failure (${input.vaultName})`,
    html: renderAccessEmailHtml({
      title: 'Sync failure',
      bodyHtml,
      cta: { label: 'Review vault sync', href: `${base}/companion#diagnostics` },
    }),
  }
}
