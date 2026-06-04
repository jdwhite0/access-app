'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  PageHeader,
  SectionPanel,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
} from '@/lib/design-system/components/platform'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import { listCustomers, addCustomer, archiveCustomer } from '@/lib/actions/customers'
import type { Customer, CustomerType } from '@/types/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<CustomerType, string> = {
  client:     'Client',
  lead:       'Lead',
  subscriber: 'Subscriber',
  partner:    'Partner',
  contact:    'Contact',
}

const TYPE_OPTIONS: Array<{ value: CustomerType; label: string }> = [
  { value: 'client',     label: 'Client — paying or contracted' },
  { value: 'lead',       label: 'Lead — potential opportunity' },
  { value: 'subscriber', label: 'Subscriber — newsletter or product' },
  { value: 'partner',    label: 'Partner — collaborator or affiliate' },
  { value: 'contact',    label: 'Contact — general relationship' },
]

const TYPE_TONE: Record<CustomerType, 'operational' | 'neutral' | 'degraded'> = {
  client:     'operational',
  lead:       'neutral',
  subscriber: 'neutral',
  partner:    'degraded',
  contact:    'neutral',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerRow({ customer, onArchive }: { customer: Customer; onArchive: (id: string) => void }) {
  const [removing, setRemoving] = useState(false)

  async function handleArchive() {
    if (!confirm(`Remove "${customer.name}" from your customers?`)) return
    setRemoving(true)
    await archiveCustomer(customer.id)
    onArchive(customer.id)
  }

  return (
    <div className="access-customer-row">
      <div className="access-customer-row__main">
        <p className="access-customer-row__name">{customer.name}</p>
        {customer.email && (
          <p className="access-customer-row__email">{customer.email}</p>
        )}
        {customer.notes && (
          <p className="access-customer-row__notes">{customer.notes}</p>
        )}
      </div>
      <div className="access-customer-row__meta">
        <StatusPill label={TYPE_LABELS[customer.type]} tone={TYPE_TONE[customer.type]} />
        <span className="access-platform-meta">{fmtDate(customer.created_at)}</span>
        <button
          type="button"
          className="access-customer-row__remove"
          onClick={handleArchive}
          disabled={removing}
          aria-label={`Remove ${customer.name}`}
        >
          {removing ? '…' : '×'}
        </button>
      </div>
    </div>
  )
}

// ── Add customer form ─────────────────────────────────────────────────────────

type FormState = 'idle' | 'submitting' | 'success' | 'error' | 'schema_missing'

function AddCustomerForm({ onAdded }: { onAdded: (c: Customer) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<CustomerType>('client')
  const [notes, setNotes] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState('submitting')
    setErrorMsg(null)
    const { customer, error } = await addCustomer({ name, email, type, notes })
    if (error) {
      setFormState(error.includes('schema') || error.includes('table') ? 'schema_missing' : 'error')
      setErrorMsg(error)
      return
    }
    if (customer) {
      onAdded(customer)
      setName('')
      setEmail('')
      setType('client')
      setNotes('')
      setFormState('success')
      setTimeout(() => setFormState('idle'), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="access-customer-form">
      <div className="access-customer-form__grid">
        <div className="access-vault-form__field">
          <label className="access-vault-form__label" htmlFor="c-name">Name <span style={{ color: 'var(--error)' }}>*</span></label>
          <input
            id="c-name"
            className="access-vault-form__input"
            type="text"
            placeholder="Jane Smith or Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="access-vault-form__field">
          <label className="access-vault-form__label" htmlFor="c-email">Email</label>
          <input
            id="c-email"
            className="access-vault-form__input"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="access-vault-form__field">
          <label className="access-vault-form__label" htmlFor="c-type">Relationship type</label>
          <select
            id="c-type"
            className="access-vault-form__input"
            value={type}
            onChange={(e) => setType(e.target.value as CustomerType)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="access-vault-form__field" style={{ gridColumn: '1 / -1' }}>
          <label className="access-vault-form__label" htmlFor="c-notes">Notes <span className="access-vault-form__label-note">— context for JYSON</span></label>
          <textarea
            id="c-notes"
            className="access-vault-form__input access-vault-form__input--textarea"
            placeholder="What's the context? What are they working on? What do they need?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {formState === 'error' && (
        <p className="access-vault-form__error">{errorMsg}</p>
      )}
      {formState === 'schema_missing' && (
        <div style={{ padding: '10px 14px', background: 'var(--warning-muted)', border: '1px solid rgba(201,164,106,0.3)', borderRadius: 7, fontSize: 12, color: 'var(--warning)' }}>
          Run <code style={{ fontFamily: 'var(--mono)' }}>supabase/schema_v6_customers.sql</code> in Supabase to create the customers table, then try again.
        </div>
      )}
      {formState === 'success' && (
        <p className="access-vault-form__success">✓ Customer added.</p>
      )}

      <div className="access-vault-form__footer">
        <PrimaryButton type="submit" disabled={formState === 'submitting'}>
          {formState === 'submitting' ? 'Adding…' : 'Add customer'}
        </PrimaryButton>
      </div>
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CustomersPageClient() {
  const layer = useJysonLayerOptional()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [])

  const clients     = customers.filter((c) => c.type === 'client')
  const leads       = customers.filter((c) => c.type === 'lead')
  const subscribers = customers.filter((c) => c.type === 'subscriber')
  const others      = customers.filter((c) => c.type !== 'client' && c.type !== 'lead' && c.type !== 'subscriber')

  function handleAdded(c: Customer) {
    setCustomers((prev) => [c, ...prev])
    setShowForm(false)
  }

  function handleArchived(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          eyebrow="Main"
          title="Customers"
          description="Everyone you serve — clients, leads, subscribers, partners, and relationships connected to your revenue."
          actions={
            <PrimaryButton type="button" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : 'Add customer'}
            </PrimaryButton>
          }
          secondary={
            layer ? (
              <button
                type="button"
                className="access-platform-btn-secondary"
                onClick={() => void layer.submit('Who are my most important customers and what should I do next with each of them?')}
              >
                Ask JYSON about my customers
              </button>
            ) : (
              <Link href="/companion" className="access-platform-btn-secondary">
                Ask JYSON about my customers
              </Link>
            )
          }
        />

        {/* Add form */}
        {showForm && (
          <SectionPanel title="Add a customer">
            <AddCustomerForm onAdded={handleAdded} />
          </SectionPanel>
        )}

        {/* Loading */}
        {loading ? (
          <div className="access-platform-loading">Loading customers…</div>
        ) : customers.length === 0 && !showForm ? (
          /* Empty state */
          <div className="access-vault-empty" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
            <p className="access-vault-empty__title">No customers yet.</p>
            <p className="access-vault-empty__body">
              Customers are the people and organizations connected to your revenue — clients, subscribers, leads, and partnerships.
              Add your first customer to start tracking the relationships that matter.
            </p>
            <div className="access-vault-empty__actions" style={{ justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="access-platform-primary-btn"
                onClick={() => setShowForm(true)}
              >
                Add customer
              </button>
              <Link href="/settings/billing" className="access-platform-secondary-btn">
                Connect Stripe
              </Link>
              {layer && (
                <button
                  type="button"
                  className="access-platform-secondary-btn"
                  onClick={() => void layer.submit('Help me define my customer model and who I should be tracking.')}
                >
                  Ask JYSON
                </button>
              )}
            </div>
          </div>
        ) : customers.length > 0 ? (
          <div className="access-shell-sections">
            {clients.length > 0 && (
              <SectionPanel title={`Clients (${clients.length})`} description="Paying or contracted relationships.">
                <div className="access-customer-list">
                  {clients.map((c) => <CustomerRow key={c.id} customer={c} onArchive={handleArchived} />)}
                </div>
              </SectionPanel>
            )}
            {leads.length > 0 && (
              <SectionPanel title={`Leads (${leads.length})`} description="Active opportunities and conversations.">
                <div className="access-customer-list">
                  {leads.map((c) => <CustomerRow key={c.id} customer={c} onArchive={handleArchived} />)}
                </div>
              </SectionPanel>
            )}
            {subscribers.length > 0 && (
              <SectionPanel title={`Subscribers (${subscribers.length})`}>
                <div className="access-customer-list">
                  {subscribers.map((c) => <CustomerRow key={c.id} customer={c} onArchive={handleArchived} />)}
                </div>
              </SectionPanel>
            )}
            {others.length > 0 && (
              <SectionPanel title={`Other (${others.length})`}>
                <div className="access-customer-list">
                  {others.map((c) => <CustomerRow key={c.id} customer={c} onArchive={handleArchived} />)}
                </div>
              </SectionPanel>
            )}

            {/* JYSON prompts */}
            {layer && (
              <SectionPanel title="Ask JYSON about your customers">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    'Who in my pipeline has the highest potential right now?',
                    'Which client should I follow up with this week?',
                    'What offer should I send to my leads?',
                    'Summarize my current customer landscape.',
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="access-jyson-layer__chip"
                      onClick={() => void layer.submit(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </SectionPanel>
            )}
          </div>
        ) : null}

        {/* Stripe CTA */}
        <SectionPanel
          title="Import from Stripe"
          description="Once your Stripe account is connected, subscribers and one-time buyers will appear here automatically."
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SecondaryButton href="/settings/billing">Connect Stripe</SecondaryButton>
            <SecondaryButton href="/plans">View plans</SecondaryButton>
          </div>
        </SectionPanel>
      </div>

      <style>{`
        .access-customer-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .access-customer-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .access-customer-row:last-child { border-bottom: none; }
        .access-customer-row__main { flex: 1; min-width: 0; }
        .access-customer-row__name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text);
          margin: 0 0 2px;
        }
        .access-customer-row__email {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0 0 4px;
          font-family: var(--mono);
        }
        .access-customer-row__notes {
          font-size: 0.8125rem;
          color: var(--text-dim);
          line-height: 1.45;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 48ch;
        }
        .access-customer-row__meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .access-customer-row__remove {
          background: none;
          border: none;
          font-size: 16px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px 4px;
          line-height: 1;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .access-customer-row__remove:hover { opacity: 1; color: var(--error); }
        .access-customer-form__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 640px) {
          .access-customer-form__grid { grid-template-columns: 1fr; }
          .access-customer-row__notes { max-width: 28ch; }
        }
      `}</style>
    </AccessAppLayout>
  )
}
