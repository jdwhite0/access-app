'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import AppSystemNav from '@/components/access/AppSystemNav'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import {
  exportFounderBlueprintYaml,
  getOrCreateFounderBlueprint,
  updateFounderBlueprint,
} from '@/lib/actions/founder-blueprint'
import { generateFounderOsFromBlueprint } from '@/lib/actions/founder-os-generate'
import { stageLabel } from '@/lib/founder-os/stage-labels'
import {
  deriveUsername,
  downloadTextFile,
  slugFromLabel,
  toAccessHandle,
} from '@/lib/founder-wizard/client-utils'
import type {
  FounderBlueprintSpec,
  FounderProductType,
} from '@/types/founder-blueprint'

type WizardStep =
  | 'sign-in'
  | 'handle'
  | 'organizations'
  | 'products'
  | 'experiences'
  | 'review'

const STEPS: WizardStep[] = [
  'handle',
  'organizations',
  'products',
  'experiences',
  'review',
]

const STEP_LABELS: Record<WizardStep, string> = {
  'sign-in': 'Sign in',
  handle: 'Identity',
  organizations: 'Companies',
  products: 'Products',
  experiences: 'Experiences',
  review: 'Review',
}

export default function FounderBlueprintWizard() {
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const { user } = useUser()

  const [step, setStep] = useState<WizardStep>('sign-in')
  const [spec, setSpec] = useState<FounderBlueprintSpec | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [statusLine, setStatusLine] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [exportedAt, setExportedAt] = useState<string | null>(null)
  const [founderOsReady, setFounderOsReady] = useState<string | null>(null)
  const [pendingDisplayName, setPendingDisplayName] = useState('')

  const username = useMemo(() => deriveUsername(user), [user])
  const proposedHandle = useMemo(() => toAccessHandle(username), [username])
  const displayNameDefault = useMemo(
    () => user?.fullName || user?.firstName || username,
    [user, username]
  )

  useEffect(() => {
    setPendingDisplayName(displayNameDefault)
  }, [displayNameDefault])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setStep('sign-in')
      return
    }
    if (step === 'sign-in') setStep('handle')
  }, [isLoaded, isSignedIn, step])

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number])

  const goSignIn = useCallback(() => {
    redirectToSignIn({ redirectUrl: `${window.location.origin}/founder` })
  }, [redirectToSignIn])

  const claimHandleAndLoadBlueprint = useCallback(async () => {
    setBusy(true)
    setErrors([])
    setStatusLine('Setting up your identity…')
    try {
      const { identity, error: identityError } = await getOrCreateIdentity(proposedHandle)
      if (!identity?.handle) {
        setErrors([
          identityError ??
            'We could not create your Founder ID. Please try again or contact support.',
        ])
        return
      }
      const handle = identity.handle
      const result = await getOrCreateFounderBlueprint()
      if (!result) {
        setErrors([
          'Your Founder Blueprint could not be started. Sign in again and continue from Identity.',
        ])
        return
      }
      const next: FounderBlueprintSpec = {
        ...result.spec,
        founder: {
          display_name: pendingDisplayName.trim() || displayNameDefault,
          access_handle: handle,
        },
        output: {
          ...result.spec.output,
          name: `${(pendingDisplayName.trim() || displayNameDefault)} Founder OS`,
        },
      }
      const { result: saved, validation } = await updateFounderBlueprint({
        founder: next.founder,
        output: next.output,
      })
      if (!validation.valid || !saved) {
        setSpec(next)
        setErrors(validation.errors.length ? validation.errors : ['Could not persist founder profile.'])
        return
      }
      setSpec(saved.spec)
      setLastSavedAt(new Date().toISOString())
      setStatusLine('Your Founder Identity is ready.')
      setStep('organizations')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('clerkMiddleware') || msg.includes('auth-middleware')) {
        setErrors([
          'Authentication middleware is not active. Restart `npm run dev` in access-app, then try CONTINUE again.',
        ])
      } else {
        setErrors([
          msg || 'Something went wrong while setting up your identity. Please try again.',
        ])
      }
    } finally {
      setBusy(false)
    }
  }, [proposedHandle, displayNameDefault, pendingDisplayName])

  const saveBlueprint = useCallback(async () => {
    if (!spec) return false
    setBusy(true)
    setErrors([])
    setStatusLine('Saving your blueprint…')
    try {
      const { result, validation } = await updateFounderBlueprint({
        founder: spec.founder,
        organizations: spec.organizations,
        products: spec.products,
        experiences: spec.experiences,
        output: spec.output,
        blueprint_version: spec.blueprint_version,
      })
      if (!validation.valid || !result) {
        setErrors(validation.errors.length ? validation.errors : ['Save failed.'])
        return false
      }
      setSpec(result.spec)
      setLastSavedAt(new Date().toISOString())
      setStatusLine('Your blueprint is saved.')
      return true
    } catch {
      setErrors(['Unexpected error while saving.'])
      return false
    } finally {
      setBusy(false)
    }
  }, [spec])

  const exportYaml = useCallback(async () => {
    if (!spec) return
    setBusy(true)
    setErrors([])
    setStatusLine('Preparing your export…')
    try {
      const { validation: saveValidation } = await updateFounderBlueprint({
        founder: spec.founder,
        organizations: spec.organizations,
        products: spec.products,
        experiences: spec.experiences,
        output: spec.output,
      })
      if (!saveValidation.valid) {
        setErrors(saveValidation.errors)
        return
      }
      const { exportResult, validation } = await exportFounderBlueprintYaml()
      if (!validation.valid || !exportResult) {
        setErrors(validation.errors.length ? validation.errors : ['Export failed.'])
        return
      }
      setSpec(exportResult.spec)
      setExportedAt(exportResult.spec.exported_at ?? new Date().toISOString())
      const filename = `${exportResult.spec.output.founder_os_id}.yaml`
      downloadTextFile(filename, exportResult.yaml)

      setStatusLine(stageLabel('generating_registry'))
      const gen = await generateFounderOsFromBlueprint()
      if (!gen.success) {
        setErrors([gen.message])
        return
      }
      setFounderOsReady(gen.outDir ?? gen.founderOsId ?? 'ready')
      setStatusLine(gen.message)
    } catch {
      setErrors(['Unexpected error while exporting.'])
    } finally {
      setBusy(false)
    }
  }, [spec])

  if (!isLoaded) {
    return (
      <div className="founder-wizard founder-wizard--center">
        <p className="founder-wizard-muted">
          ACCESS<span className="cursor" />
        </p>
      </div>
    )
  }

  if (step === 'sign-in') {
    return (
      <div className="founder-wizard founder-wizard--onboarding">
        <div className="founder-wizard-card fade-in">
          <OnboardingHero />
          <p className="founder-wizard-signin-note">
            Sign in to begin. Your work is saved securely to your account.
          </p>
          <button type="button" className="auth-primary-btn founder-wizard-cta" onClick={goSignIn}>
            <span className="auth-primary-icon">◈</span>
            Continue
          </button>
          <Link href="/" className="founder-wizard-back founder-wizard-back--center">
            Back to terminal
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'handle') {
    return (
      <div className="founder-wizard founder-wizard--onboarding">
        {errors.length > 0 && (
          <div className="founder-wizard-errors founder-wizard-errors--floating" role="alert">
            {errors.map(e => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        {statusLine && (
          <p className="founder-wizard-status founder-wizard-status--floating">{statusLine}</p>
        )}
        <HandleStep
          displayName={spec?.founder.display_name ?? pendingDisplayName}
          founderId={spec?.founder.access_handle ?? proposedHandle}
          busy={busy}
          onDisplayNameChange={setPendingDisplayName}
          onContinue={claimHandleAndLoadBlueprint}
        />
        <Link href="/" className="founder-wizard-back founder-wizard-back--corner">
          Back to terminal
        </Link>
      </div>
    )
  }

  const navHandle = spec?.founder.access_handle ?? proposedHandle

  return (
    <div className="founder-wizard">
      <AppSystemNav active="founder" accessId={navHandle} />
      <header className="founder-wizard-header founder-wizard-header--below-nav">
        <div>
          <p className="founder-wizard-eyebrow">Founder Blueprint</p>
          <h1 className="founder-wizard-title-sm">Build your digital world</h1>
        </div>
      </header>

      <nav className="founder-wizard-steps" aria-label="Wizard progress">
        {STEPS.map((s, i) => {
          const active = s === step
          const done = stepIndex > i
          return (
            <button
              key={s}
              type="button"
              className={`founder-wizard-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
              disabled={busy || (!done && !active)}
              onClick={() => {
                if (done || active) setStep(s)
              }}
            >
              <span className="founder-wizard-step-num">{i + 1}</span>
              {STEP_LABELS[s]}
            </button>
          )
        })}
      </nav>

      {errors.length > 0 && (
        <div className="founder-wizard-errors" role="alert">
          {errors.map(e => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {statusLine && <p className="founder-wizard-status">{statusLine}</p>}

      <main className="founder-wizard-main fade-in">
        {step === 'organizations' && spec && (
          <OrganizationsStep
            items={spec.organizations}
            onChange={organizations => setSpec({ ...spec, organizations })}
            onBack={() => setStep('handle')}
            onNext={() => setStep('products')}
          />
        )}

        {step === 'products' && spec && (
          <ProductsStep
            items={spec.products}
            organizations={spec.organizations}
            onChange={products => setSpec({ ...spec, products })}
            onBack={() => setStep('organizations')}
            onNext={() => setStep('experiences')}
          />
        )}

        {step === 'experiences' && spec && (
          <ExperiencesStep
            items={spec.experiences}
            products={spec.products}
            onChange={experiences => setSpec({ ...spec, experiences })}
            onBack={() => setStep('products')}
            onNext={() => setStep('review')}
          />
        )}

        {step === 'review' && spec && (
          <ReviewStep
            spec={spec}
            busy={busy}
            lastSavedAt={lastSavedAt}
            exportedAt={exportedAt}
            founderOsReady={founderOsReady}
            onSave={saveBlueprint}
            onExport={exportYaml}
            onBack={() => setStep('experiences')}
          />
        )}
      </main>
    </div>
  )
}

function OnboardingHero() {
  return (
    <header className="founder-wizard-hero">
      <h1 className="founder-wizard-hero-title">Welcome to Your Digital World</h1>
      <p className="founder-wizard-hero-subtitle">
        Create the identity that connects everything you build.
      </p>
    </header>
  )
}

function HandleStep({
  displayName,
  founderId,
  busy,
  onDisplayNameChange,
  onContinue,
}: {
  displayName: string
  founderId: string
  busy: boolean
  onDisplayNameChange: (name: string) => void
  onContinue: () => void
}) {
  return (
    <section className="founder-wizard-card fade-in">
      <OnboardingHero />

      <div className="founder-wizard-section">
        <h2 className="founder-wizard-section-title">Create Your Founder Identity</h2>
        <p className="founder-wizard-body">
          Your Founder Identity is the starting point of your digital world.
        </p>
        <p className="founder-wizard-body">
          Everything you build — companies, products, experiences, content, systems, and future
          ventures — connects back to it.
        </p>
      </div>

      <label className="founder-wizard-field founder-wizard-field--onboarding">
        <span className="founder-wizard-label">What should people call you?</span>
        <span className="founder-wizard-helper">
          This can be your name, founder name, or public-facing identity.
        </span>
        <input
          type="text"
          value={displayName}
          onChange={e => onDisplayNameChange(e.target.value)}
          disabled={busy}
          autoComplete="name"
        />
      </label>

      <div className="founder-wizard-id-block">
        <span className="founder-wizard-label">Your Founder ID</span>
        <span className="founder-wizard-helper">
          This becomes your permanent identity inside ACCESS.
        </span>
        <p className="founder-wizard-id-value">{founderId}</p>
        <p className="founder-wizard-foundation">
          This identity becomes the foundation of everything you build inside the digital world.
        </p>
      </div>

      <button
        type="button"
        className="auth-primary-btn founder-wizard-cta"
        disabled={busy || !displayName.trim()}
        onClick={onContinue}
      >
        {busy ? 'Continuing…' : 'Continue'}
      </button>
    </section>
  )
}

function OrganizationsStep({
  items,
  onChange,
  onBack,
  onNext,
}: {
  items: FounderBlueprintSpec['organizations']
  onChange: (items: FounderBlueprintSpec['organizations']) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="founder-wizard-panel">
      <h2 className="founder-wizard-h2">Your companies</h2>
      <p className="founder-wizard-lead">
        Add the organizations behind your work — studios, brands, or ventures. Start with at least
        one.
      </p>
      <EntityEditor<FounderBlueprintSpec['organizations'][number]>
        items={items}
        fields={[
          { key: 'name', label: 'Name', placeholder: 'JD Productions' },
          { key: 'id', label: 'ID', placeholder: 'jd-productions', slugFrom: 'name' },
        ]}
        onChange={onChange}
        makeEmpty={() => ({ id: '', name: '' })}
      />
      <WizardNav onBack={onBack} onNext={onNext} nextDisabled={items.length < 1 || items.some(o => !o.id || !o.name)} />
    </section>
  )
}

function ProductsStep({
  items,
  organizations,
  onChange,
  onBack,
  onNext,
}: {
  items: FounderBlueprintSpec['products']
  organizations: FounderBlueprintSpec['organizations']
  onChange: (items: FounderBlueprintSpec['products']) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="founder-wizard-panel">
      <h2 className="founder-wizard-h2">Your products</h2>
      <p className="founder-wizard-lead">
        Name what you offer — platforms you run or portfolios you grow. Link each to a company when
        it fits.
      </p>
      <EntityEditor<FounderBlueprintSpec['products'][number]>
        items={items}
        fields={[
          { key: 'name', label: 'Name', placeholder: 'ACCESS' },
          { key: 'id', label: 'ID', placeholder: 'access', slugFrom: 'name' },
        ]}
        extraRow={(item, index, update) => (
          <>
            <label className="founder-wizard-field founder-wizard-field--inline">
              <span>Type</span>
              <select
                value={item.type}
                onChange={e => update(index, { type: e.target.value as FounderProductType })}
              >
                <option value="platform">platform</option>
                <option value="portfolio">portfolio</option>
              </select>
            </label>
            <label className="founder-wizard-field founder-wizard-field--inline">
              <span>Organization</span>
              <select
                value={item.organization_id ?? ''}
                onChange={e =>
                  update(index, {
                    organization_id: e.target.value || undefined,
                  })
                }
              >
                <option value="">— none —</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        onChange={onChange}
        makeEmpty={() => ({ id: '', name: '', type: 'platform' as FounderProductType })}
      />
      <WizardNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={items.length < 1 || items.some(p => !p.id || !p.name)}
      />
    </section>
  )
}

function ExperiencesStep({
  items,
  products,
  onChange,
  onBack,
  onNext,
}: {
  items: FounderBlueprintSpec['experiences']
  products: FounderBlueprintSpec['products']
  onChange: (items: FounderBlueprintSpec['experiences']) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="founder-wizard-panel">
      <h2 className="founder-wizard-h2">Your experiences</h2>
      <p className="founder-wizard-lead">
        Where people meet your world — sites, portals, and live destinations. Use a full https link
        for each.
      </p>
      <EntityEditor<FounderBlueprintSpec['experiences'][number]>
        items={items}
        fields={[
          { key: 'name', label: 'Name', placeholder: 'JD System Portal' },
          { key: 'id', label: 'ID', placeholder: 'jdwhite-world', slugFrom: 'name' },
          { key: 'url', label: 'URL', placeholder: 'https://jdwhite.world' },
        ]}
        extraRow={(item, index, update) => (
          <label className="founder-wizard-field founder-wizard-field--inline">
            <span>Product</span>
            <select
              value={item.product_id ?? ''}
              onChange={e => update(index, { product_id: e.target.value || undefined })}
            >
              <option value="">— none —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        onChange={onChange}
        makeEmpty={() => ({ id: '', name: '', url: 'https://' })}
      />
      <WizardNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={
          items.length < 1 ||
          items.some(e => !e.id || !e.name || !e.url || !e.url.startsWith('http'))
        }
      />
    </section>
  )
}

function ReviewStep({
  spec,
  busy,
  lastSavedAt,
  exportedAt,
  founderOsReady,
  onSave,
  onExport,
  onBack,
}: {
  spec: FounderBlueprintSpec
  busy: boolean
  lastSavedAt: string | null
  exportedAt: string | null
  founderOsReady: string | null
  onSave: () => Promise<boolean>
  onExport: () => void
  onBack: () => void
}) {
  return (
    <section className="founder-wizard-panel">
      <h2 className="founder-wizard-h2">Review your blueprint</h2>
      <p className="founder-wizard-lead">
        Confirm everything looks right. Save keeps your blueprint in ACCESS. Export downloads a file
        you can use to generate your Founder OS.
      </p>

      <pre className="founder-wizard-preview">{JSON.stringify(spec, null, 2)}</pre>

      {lastSavedAt && (
        <p className="founder-wizard-muted">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>
      )}
      {exportedAt && (
        <p className="founder-wizard-muted">Last exported: {new Date(exportedAt).toLocaleString()}</p>
      )}
      {founderOsReady && (
        <p className="founder-wizard-status">Founder OS Ready — {founderOsReady}</p>
      )}

      <div className="founder-wizard-actions">
        <button type="button" className="founder-wizard-btn-secondary" disabled={busy} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="founder-wizard-btn-secondary"
          disabled={busy}
          onClick={() => void onSave()}
        >
          {busy ? 'Working…' : 'Save'}
        </button>
        <button type="button" className="auth-primary-btn" disabled={busy} onClick={() => void onExport()}>
          {busy ? 'Working…' : 'Export blueprint'}
        </button>
      </div>
    </section>
  )
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="founder-wizard-actions">
      <button type="button" className="founder-wizard-btn-secondary" onClick={onBack}>
        Back
      </button>
      <button type="button" className="auth-primary-btn" disabled={nextDisabled} onClick={onNext}>
        Continue
      </button>
    </div>
  )
}

type FieldDef<T> = {
  key: keyof T & string
  label: string
  placeholder?: string
  slugFrom?: keyof T & string
}

function EntityEditor<T extends object>({
  items,
  fields,
  extraRow,
  onChange,
  makeEmpty,
}: {
  items: T[]
  fields: FieldDef<T>[]
  extraRow?: (item: T, index: number, update: (index: number, patch: Partial<T>) => void) => ReactNode
  onChange: (items: T[]) => void
  makeEmpty: () => T
}) {
  const update = (index: number, patch: Partial<T>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  const add = () => onChange([...items, makeEmpty()])
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="founder-wizard-entities">
      {items.map((item, index) => (
        <div key={index} className="founder-wizard-entity-card">
          <div className="founder-wizard-entity-head">
            <span>#{index + 1}</span>
            <button type="button" className="founder-wizard-link-btn" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
          <div className="founder-wizard-entity-grid">
            {fields.map(f => (
              <label key={f.key} className="founder-wizard-field">
                <span>{f.label}</span>
                <input
                  type="text"
                  value={String(item[f.key] ?? '')}
                  placeholder={f.placeholder}
                  onChange={e => {
                    const value = e.target.value
                    const patch: Partial<T> = { [f.key]: value } as Partial<T>
                    if (f.slugFrom && f.key === 'name') {
                      const row = item as Record<string, string>
                      const currentId = String(row.id ?? '')
                      const priorNameSlug = slugFromLabel(String(row.name ?? ''))
                      if (!currentId || currentId === priorNameSlug) {
                        ;(patch as Record<string, string>).id = slugFromLabel(value)
                      }
                    }
                    update(index, patch)
                  }}
                  onBlur={e => {
                    if (f.key === 'id' && e.target.value) {
                      update(index, { id: slugFromLabel(e.target.value) } as unknown as Partial<T>)
                    }
                  }}
                />
              </label>
            ))}
            {extraRow?.(item, index, update)}
          </div>
        </div>
      ))}
      <button type="button" className="founder-wizard-btn-secondary" onClick={add}>
        + Add item
      </button>
    </div>
  )
}

