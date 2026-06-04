'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { executeRecoveryAction } from '@/lib/actions/access-recovery'
import type { RecoveryAction, RecoveryActionId, RecoveryPlan } from '@/lib/access/recovery-framework'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'

type Props = {
  plan: RecoveryPlan
  /** Called when companion reload succeeds */
  onCompanionLoaded?: () => void
  /** Auto-run primary auto-fix once (cloud-ready companion) */
  autoFix?: boolean
  variant?: 'card' | 'inline'
  showTechnical?: boolean
  /** Return true to skip default server navigation (e.g. vault re-sync) */
  onAction?: (actionId: RecoveryActionId) => boolean | void
}

export function AccessRecoveryGuide({
  plan,
  onCompanionLoaded,
  autoFix = false,
  variant = 'card',
  showTechnical = false,
  onAction,
}: Props) {
  const router = useRouter()
  const layer = useJysonLayerOptional()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const autoRan = useRef(false)

  const runAction = useCallback(
    async (action: RecoveryAction) => {
      if (action.desktopOnly && typeof window !== 'undefined') {
        const narrow = window.matchMedia('(max-width: 768px)').matches
        if (narrow) {
          setNote('This step is available on a Mac or PC. JYSON cloud chat still works on your phone.')
          return
        }
      }

      if (action.href) {
        router.push(action.href)
        return
      }

      if (onAction?.(action.id)) return

      setBusy(true)
      setNote(null)
      try {
        const result = await executeRecoveryAction(action.id)
        if (result.message) setNote(result.message)
        if (result.navigateTo) router.push(result.navigateTo)
        if (result.companion?.context) onCompanionLoaded?.()
      } catch (e) {
        setNote(e instanceof Error ? e.message : 'Action failed.')
      } finally {
        setBusy(false)
      }
    },
    [router, onCompanionLoaded]
  )

  useEffect(() => {
    if (!autoFix || !plan.jysonCanAutoFix || autoRan.current) return
    const primary = plan.actions.find((a) => a.id === 'open_companion' || a.id === 'retry_load')
    if (!primary) return
    autoRan.current = true
    void runAction(primary)
  }, [autoFix, plan, runAction])

  function askJyson() {
    const prompt = plan.jysonPrompt
    if (layer) {
      void layer.submit(prompt)
      return
    }
    router.push(`/companion?recover=${encodeURIComponent(plan.blockerCode)}`)
  }

  const primaryActions = plan.actions.filter((a) => a.kind === 'primary')
  const secondaryActions = plan.actions.filter((a) => a.kind !== 'primary')

  const rootClass =
    variant === 'inline'
      ? 'access-recovery access-recovery--inline'
      : 'access-recovery access-recovery--card'

  return (
    <section className={rootClass} aria-label="Recovery options">
      <p className="access-recovery__eyebrow">
        {plan.layer === 'account' ? 'Account setup' : 'Get back to work'}
      </p>
      <h2 className="access-recovery__title">{plan.title}</h2>
      <p className="access-recovery__body">{plan.body}</p>

      {plan.question && (
        <div className="access-recovery__question">
          <p className="access-recovery__question-prompt">{plan.question.prompt}</p>
          <div className="access-recovery__choices" role="group" aria-label={plan.question.prompt}>
            {plan.question.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`access-recovery__choice${selectedChoice === c.id ? ' is-selected' : ''}`}
                disabled={busy}
                onClick={() => {
                  setSelectedChoice(c.id)
                  const act = plan.actions.find((a) => a.id === c.actionId)
                  if (act) void runAction(act)
                  else void executeRecoveryAction(c.actionId).then((r) => {
                    if (r.navigateTo) router.push(r.navigateTo)
                  })
                }}
              >
                <span className="access-recovery__choice-label">{c.label}</span>
                {c.hint ? <span className="access-recovery__choice-hint">{c.hint}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="access-recovery__actions">
        {primaryActions.map((a) =>
          a.href ? (
            <PrimaryButton key={a.id} href={a.href}>
              {a.label}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              key={a.id}
              type="button"
              disabled={busy}
              onClick={() => void runAction(a)}
            >
              {busy ? 'Working…' : a.label}
            </PrimaryButton>
          )
        )}
        <SecondaryButton type="button" disabled={busy} onClick={() => askJyson()}>
          Ask JYSON to fix this
        </SecondaryButton>
        {secondaryActions.map((a) =>
          a.href ? (
            <Link key={a.id} href={a.href} className="access-recovery__link-secondary">
              {a.label}
            </Link>
          ) : (
            <button
              key={a.id}
              type="button"
              className="access-recovery__link-secondary"
              disabled={busy}
              onClick={() => void runAction(a)}
            >
              {a.label}
            </button>
          )
        )}
      </div>

      {note ? (
        <p className="access-recovery__note" role="status">
          {note}
        </p>
      ) : null}

      {showTechnical && plan.technicalDetail ? (
        <p className="access-recovery__technical">Detail: {plan.technicalDetail}</p>
      ) : null}
    </section>
  )
}
