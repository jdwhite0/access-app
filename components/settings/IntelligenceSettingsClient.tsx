'use client'

import { useEffect, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import { getAIProfile, updateAIProfile } from '@/lib/actions/ai-profile'

export default function IntelligenceSettingsClient() {
  const [aiName, setAiName] = useState('')
  const [aiRole, setAiRole] = useState('')
  const [aiTone, setAiTone] = useState('')
  const [aiPurpose, setAiPurpose] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAIProfile().then((result) => {
      if ('profile' in result) {
        setAiName(result.profile.ai_name)
        setAiRole(result.profile.ai_role)
        setAiTone(result.profile.ai_tone)
        setAiPurpose(result.profile.ai_purpose)
      }
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await updateAIProfile({
      ai_name: aiName.trim() || 'JYSON',
      ai_role: aiRole.trim(),
      ai_tone: aiTone.trim(),
      ai_purpose: aiPurpose.trim(),
    })
    if ('error' in result) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Intelligence"
          description="Personalize your AI operator — name, role, tone, and purpose."
        />

        <div className="access-settings-profile-grid">
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
          ) : (
            <SectionPanel title="Your AI operator">
              <form className="access-settings-form" onSubmit={handleSave}>
                <div className="access-settings-form__row">
                  <label className="access-settings-form__label">AI name</label>
                  <input
                    className="access-settings-form__input"
                    type="text"
                    placeholder="JYSON"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                  />
                  <p className="access-platform-meta" style={{ marginTop: 4 }}>
                    What you call your AI. Default is JYSON. Examples: Kingdom Operator, Builder OS, Studio Assistant.
                  </p>
                </div>

                <div className="access-settings-form__row">
                  <label className="access-settings-form__label">Role</label>
                  <input
                    className="access-settings-form__input"
                    type="text"
                    placeholder="AI operator"
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value)}
                  />
                </div>

                <div className="access-settings-form__row">
                  <label className="access-settings-form__label">Tone</label>
                  <input
                    className="access-settings-form__input"
                    type="text"
                    placeholder="strategic, clear, direct"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                  />
                  <p className="access-platform-meta" style={{ marginTop: 4 }}>
                    Describe how your AI should communicate. Examples: warm and encouraging, precise and technical, creative and bold.
                  </p>
                </div>

                <div className="access-settings-form__row">
                  <label className="access-settings-form__label">Purpose</label>
                  <textarea
                    className="access-settings-form__input"
                    rows={3}
                    placeholder="Help you turn ideas, assets, knowledge, and work into systems that compound"
                    value={aiPurpose}
                    onChange={(e) => setAiPurpose(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                  <p className="access-platform-meta" style={{ marginTop: 4 }}>
                    What your AI is focused on helping you achieve. This becomes part of every JYSON session.
                  </p>
                </div>

                {error && <p className="access-settings-form__error">{error}</p>}
                {saved && <p className="access-settings-form__saved">✓ Intelligence settings saved.</p>}

                <div className="access-settings-form__actions">
                  <button
                    type="submit"
                    className="access-settings-btn access-settings-btn--primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </SectionPanel>
          )}

          <SectionPanel title="About your AI">
            <div className="access-shell-panel" style={{ padding: '14px 16px' }}>
              <p className="access-platform-body" style={{ marginBottom: 12 }}>
                Your AI operator lives inside ACCESS and powers every intelligent action — JYSON sessions, recommendations, project guidance, and workspace intelligence.
              </p>
              <p className="access-platform-meta">
                The name, role, tone, and purpose you set here are used across all JYSON interactions to give you relevant, personalized guidance.
              </p>
            </div>
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
