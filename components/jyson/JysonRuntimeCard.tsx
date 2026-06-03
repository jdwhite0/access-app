'use client'

import type { OpenJarvisRuntimeCard } from '@/lib/openjarvis-bridge/runtime-card'

const CONTENT_PREVIEW_MAX = 1200

function truncatePreview(text: string, max = CONTENT_PREVIEW_MAX): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n… [truncated ${text.length - max} chars]`
}

type JysonRuntimeCardProps = {
  card: OpenJarvisRuntimeCard
  apiSuccess: boolean
  compact?: boolean
}

export default function JysonRuntimeCard({
  card,
  apiSuccess,
  compact = false,
}: JysonRuntimeCardProps) {
  const denied = card.permission.allowed === false
  const ok = card.success && apiSuccess
  const contentPreview =
    typeof card.content === 'string' && card.content.length > 0
      ? truncatePreview(card.content, compact ? 800 : CONTENT_PREVIEW_MAX)
      : null

  return (
    <div
      className={`jyson-runtime-card fade-in${denied ? ' denied' : ''}${ok ? ' ok' : ' fail'}${compact ? ' compact' : ''}`}
    >
      <p className="jyson-runtime-card-title">
        {ok ? 'Success' : denied ? 'Permission denied' : 'Failed'}
        {' · '}
        <code>{card.toolId}</code>
        {card.openJarvisToolId ? (
          <>
            {' → '}
            <code>{card.openJarvisToolId}</code>
          </>
        ) : null}
      </p>

      {compact ? (
        <p className="jyson-runtime-card-summary">
          {card.permission.allowed ? 'Allowed' : 'Denied'} — {card.permission.reason}
        </p>
      ) : (
        <dl className="jyson-dispatch-grid">
          <div>
            <dt>Tool</dt>
            <dd>
              <code>{card.toolId}</code>
            </dd>
          </div>
          <div>
            <dt>Success</dt>
            <dd className={card.success ? 'yes' : 'no'}>{card.success ? 'true' : 'false'}</dd>
          </div>
          <div>
            <dt>Permission</dt>
            <dd className={card.permission.allowed ? 'yes' : 'no'}>
              {card.permission.allowed ? 'allowed' : 'denied'}
            </dd>
          </div>
          {!compact && (
            <div>
              <dt>Permission reason</dt>
              <dd>{card.permission.reason}</dd>
            </div>
          )}
          {card.openJarvisToolId && (
            <div>
              <dt>OpenJarvis tool</dt>
              <dd>
                <code>{card.openJarvisToolId}</code>
              </dd>
            </div>
          )}
          {!compact && (
            <div className="jyson-dispatch-span">
              <dt>Invoke path</dt>
              <dd>
                <code>{card.invokePath}</code>
              </dd>
            </div>
          )}
          {card.error && (
            <div className="jyson-dispatch-span">
              <dt>Error</dt>
              <dd className="no">{card.error}</dd>
            </div>
          )}
        </dl>
      )}

      {card.error && compact && <p className="jyson-companion-error">{card.error}</p>}

      {contentPreview && (
        <pre className="jyson-runtime-content jyson-runtime-content--compact">{contentPreview}</pre>
      )}

      <details className="jyson-runtime-raw">
        <summary>Full RuntimeCard JSON</summary>
        <pre className="jyson-runtime-json">{JSON.stringify(card, null, 2)}</pre>
      </details>
    </div>
  )
}
