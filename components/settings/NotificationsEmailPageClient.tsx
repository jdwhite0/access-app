'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import {
  getEmailPreferencesAction,
  updateEmailPreferencesAction,
} from '@/lib/actions/email-preferences'
import {
  EMAIL_FREQUENCY_OPTIONS,
  REQUIRED_TRANSACTIONAL_EMAILS,
} from '@/lib/email/constants'
import type { EmailFrequency } from '@/lib/email/constants'
import type { EmailPreferencesRow } from '@/types/email'
import type { UpdateEmailPreferencesInput } from '@/types/email'

const OPTIONAL_TOGGLES = [
  { key: 'daily_brief_enabled' as const, label: 'ACCESS Daily Brief', desc: 'Morning intelligence brief for your workspace.' },
  { key: 'weekly_digest_enabled' as const, label: 'Weekly Digest', desc: 'Week in review — highlights and system activity.' },
  { key: 'product_updates_enabled' as const, label: 'Product Updates', desc: 'New features, improvements, and release notes.' },
  { key: 'founder_notes_enabled' as const, label: 'Founder Notes', desc: 'Occasional notes from the ACCESS team.' },
  { key: 'educational_content_enabled' as const, label: 'Educational Content', desc: 'Guides and playbooks for operators and builders.' },
  { key: 'partner_offers_enabled' as const, label: 'Partner Offers', desc: 'Curated offers from trusted partners (off by default).' },
]

const FREQUENCY_LABELS: Record<EmailFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  major_updates_only: 'Major updates only',
  paused: 'Pause all marketing emails',
}

type MarketingDraft = UpdateEmailPreferencesInput & {
  frequency: EmailFrequency
  marketing_paused: boolean
}

function draftFromPrefs(prefs: EmailPreferencesRow): MarketingDraft {
  return {
    frequency: prefs.frequency,
    marketing_paused: prefs.marketing_paused,
    daily_brief_enabled: prefs.daily_brief_enabled,
    weekly_digest_enabled: prefs.weekly_digest_enabled,
    product_updates_enabled: prefs.product_updates_enabled,
    founder_notes_enabled: prefs.founder_notes_enabled,
    educational_content_enabled: prefs.educational_content_enabled,
    partner_offers_enabled: prefs.partner_offers_enabled,
  }
}

const DEFAULT_ENABLED_MARKETING: MarketingDraft = {
  frequency: 'daily',
  marketing_paused: false,
  daily_brief_enabled: true,
  weekly_digest_enabled: true,
  product_updates_enabled: true,
  founder_notes_enabled: true,
  educational_content_enabled: true,
  partner_offers_enabled: false,
}

function pauseAllMarketing(draft: MarketingDraft): MarketingDraft {
  return {
    ...draft,
    frequency: 'paused',
    marketing_paused: true,
    daily_brief_enabled: false,
    weekly_digest_enabled: false,
    product_updates_enabled: false,
    founder_notes_enabled: false,
    educational_content_enabled: false,
    partner_offers_enabled: false,
  }
}

function draftsEqual(a: MarketingDraft, b: MarketingDraft): boolean {
  return (
    a.frequency === b.frequency &&
    a.marketing_paused === b.marketing_paused &&
    OPTIONAL_TOGGLES.every((t) => a[t.key] === b[t.key])
  )
}

export default function NotificationsEmailPageClient() {
  const [savedPrefs, setSavedPrefs] = useState<EmailPreferencesRow | null>(null)
  const [draft, setDraft] = useState<MarketingDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const beforePauseRef = useRef<MarketingDraft | null>(null)

  const savedDraft = useMemo(
    () => (savedPrefs ? draftFromPrefs(savedPrefs) : null),
    [savedPrefs]
  )

  const dirty = useMemo(
    () => !!(draft && savedDraft && !draftsEqual(draft, savedDraft)),
    [draft, savedDraft]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { prefs: data, error: err } = await getEmailPreferencesAction()
    if (err) setError(err)
    if (data) {
      setSavedPrefs(data)
      setDraft(draftFromPrefs(data))
    } else {
      setSavedPrefs(null)
      setDraft(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function updateDraft(patch: Partial<MarketingDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : null))
    setSaved(false)
  }

  function handleFrequency(freq: EmailFrequency) {
    if (freq === 'paused') {
      if (draft && !draft.marketing_paused) {
        beforePauseRef.current = { ...draft }
      }
      updateDraft(pauseAllMarketing(draft ?? DEFAULT_ENABLED_MARKETING))
    } else {
      updateDraft({ frequency: freq, marketing_paused: false })
    }
  }

  /** One-tap off/on for all optional emails — saves immediately so users are done in one step. */
  async function handleMasterOptionalEmails(enabled: boolean) {
    if (!draft) return

    let next: MarketingDraft
    if (!enabled) {
      if (!draft.marketing_paused) beforePauseRef.current = { ...draft }
      next = pauseAllMarketing(draft)
    } else {
      const restore = beforePauseRef.current ?? DEFAULT_ENABLED_MARKETING
      next = {
        ...restore,
        marketing_paused: false,
        frequency: restore.frequency === 'paused' ? 'daily' : restore.frequency,
      }
    }

    setDraft(next)
    setSaving(true)
    setError(null)

    const { prefs: updated, error: err } = await updateEmailPreferencesAction(next)
    setSaving(false)

    if (err) {
      setError(err)
      await load()
      return
    }

    if (updated) {
      setSavedPrefs(updated)
      setDraft(draftFromPrefs(updated))
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleDiscard() {
    if (savedDraft) setDraft({ ...savedDraft })
    setError(null)
    setSaved(false)
  }

  async function handleSave() {
    if (!draft) {
      setError('Email preferences are not available yet. Complete onboarding or apply the email_preferences migration in Supabase.')
      return
    }

    setSaving(true)
    setError(null)

    const { prefs: updated, error: err } = await updateEmailPreferencesAction(draft)
    setSaving(false)

    if (err) {
      setError(err)
      return
    }

    if (updated) {
      setSavedPrefs(updated)
      setDraft(draftFromPrefs(updated))
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <AccessAppLayout variant="default">
        <div className="access-settings-loading">Loading email preferences…</div>
      </AccessAppLayout>
    )
  }

  const marketingPaused = draft?.marketing_paused ?? false
  const optionalEmailsOn = draft ? !draft.marketing_paused : false

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Notifications & Email"
          description="Required account emails cannot be disabled. Adjust ACCESS Intelligence options below, then save your choices."
        />

        {error && <div className="access-settings-form__error" style={{ marginBottom: 16 }}>{error}</div>}
        {saved && <div className="access-settings-form__saved" style={{ marginBottom: 16 }}>✓ Preferences saved</div>}

        <div className="access-settings-profile-grid">
          <SectionPanel title="Required account emails">
            <p className="access-settings-row__desc" style={{ margin: '0 0 16px' }}>
              These emails are required for account security, billing, and product functionality.
            </p>
            <ul className="access-email-required-list">
              {REQUIRED_TRANSACTIONAL_EMAILS.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span className="access-email-required-list__badge">Always on</span>
                </li>
              ))}
            </ul>
          </SectionPanel>

          <SectionPanel title="ACCESS Intelligence emails">
            <p className="access-settings-row__desc" style={{ margin: '0 0 16px' }}>
              Optional updates from ACCESS. Unsubscribe anytime from any marketing email.
            </p>

            {!draft && !error && (
              <p className="access-settings-form__error" style={{ marginBottom: 16 }}>
                Preferences could not be loaded. If you just signed up, finish onboarding. Otherwise run{' '}
                <code>supabase/schema_v6_email_preferences.sql</code> in Supabase.
              </p>
            )}

            {draft && (
              <>
                <div className="access-email-master">
                  <div className="access-email-master__copy">
                    <p className="access-email-master__title">Optional emails</p>
                    <p className="access-email-master__desc">
                      {optionalEmailsOn
                        ? 'ACCESS Intelligence, digests, and updates can reach your inbox.'
                        : 'All optional emails are off. You will still get security, billing, and connector alerts when needed.'}
                    </p>
                  </div>
                  <label className="access-email-master__switch" aria-label="Send optional ACCESS emails">
                    <input
                      type="checkbox"
                      checked={optionalEmailsOn}
                      disabled={saving}
                      onChange={(e) => void handleMasterOptionalEmails(e.target.checked)}
                    />
                    <span className="access-email-master__track" />
                  </label>
                </div>

                <button
                  type="button"
                  className="access-email-stop-all"
                  disabled={saving || marketingPaused}
                  onClick={() => void handleMasterOptionalEmails(false)}
                >
                  Turn off all optional emails
                </button>

                <p className="access-email-draft-hint">
                  {dirty
                    ? 'You have unsaved changes below — use Save when ready.'
                    : optionalEmailsOn
                      ? 'Fine-tune categories below, or use the switch to stop everything optional.'
                      : 'Optional emails are paused. Flip the switch above to turn them back on.'}
                </p>

                <div
                  className={`access-email-detail${marketingPaused ? ' access-email-detail--muted' : ''}`}
                  aria-hidden={marketingPaused}
                >
                <div className="access-email-frequency">
                  <p className="access-settings-form__label">Frequency</p>
                  <div className="access-email-frequency__options">
                    {EMAIL_FREQUENCY_OPTIONS.map((freq) => {
                      const active =
                        draft.frequency === freq || (freq === 'paused' && draft.marketing_paused)
                      return (
                        <button
                          key={freq}
                          type="button"
                          disabled={saving}
                          className={`access-email-frequency__btn${active ? ' access-email-frequency__btn--active' : ''}`}
                          onClick={() => handleFrequency(freq)}
                        >
                          {FREQUENCY_LABELS[freq]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="access-email-toggles">
                  {OPTIONAL_TOGGLES.map((toggle) => {
                    const checked = draft[toggle.key] ?? false
                    const disabled = marketingPaused || saving
                    return (
                      <label key={toggle.key} className="access-email-toggle-row">
                        <div>
                          <p className="access-email-toggle-row__title">{toggle.label}</p>
                          <p className="access-email-toggle-row__desc">{toggle.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked && !marketingPaused}
                          disabled={disabled}
                          onChange={(e) => updateDraft({ [toggle.key]: e.target.checked })}
                        />
                      </label>
                    )
                  })}
                </div>

                <div className="access-settings-form__actions access-email-save-bar">
                  <button
                    type="button"
                    className="access-settings-btn access-settings-btn--primary"
                    disabled={saving || !dirty || !draft || marketingPaused}
                    onClick={() => void handleSave()}
                  >
                    {saving ? 'Saving…' : 'Save preferences'}
                  </button>
                  <button
                    type="button"
                    className="access-settings-btn access-settings-btn--ghost"
                    disabled={saving || !dirty}
                    onClick={handleDiscard}
                  >
                    Discard changes
                  </button>
                </div>
                </div>
              </>
            )}
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
