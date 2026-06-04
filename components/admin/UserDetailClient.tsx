'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateUserPlan, suspendUser, restoreUser, applyAdminCoupon, deleteUserAccount } from '@/lib/admin/actions'

type Identity = {
  id: string
  clerk_user_id: string
  handle: string | null
  plan: string
  stripe_customer_id: string | null
  created_at: string | null
}

type Props = {
  identity: Identity
  usage: { jysonTotal: number; jysonMo: number; registryTotal: number }
  recentEvents: Array<{ type: string; ts: string }>
}

const PLANS = ['free', 'operator', 'builder', 'founder', 'suspended'] as const
const COUPONS = ['FOUNDER50', 'PARTNER20', 'ANNUAL25', 'LEGACY100'] as const

const PLAN_COLOR: Record<string, string> = {
  founder: 'var(--gold)', builder: '#7C6CF8', operator: '#4A9EFF',
  free: 'var(--text-muted)', suspended: 'var(--error)',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', width: 140, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--mono)', flex: 1 }}>{value}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '0 16px' }}>{children}</div>
    </div>
  )
}

export default function UserDetailClient({ identity, usage, recentEvents }: Props) {
  const [plan, setPlan] = useState(identity.plan)
  const [selectedPlan, setSelectedPlan] = useState(identity.plan)
  const [selectedCoupon, setSelectedCoupon] = useState<string>(COUPONS[0])
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function doAction(label: string, fn: () => Promise<{ success: true } | { error: string }>) {
    setLoading(label)
    setMsg(null)
    const res = await fn()
    if ('success' in res) {
      setMsg({ text: `${label} — done.`, ok: true })
    } else {
      setMsg({ text: res.error, ok: false })
    }
    setLoading(null)
  }

  async function handlePlanChange() {
    await doAction('Plan updated', async () => {
      const res = await updateUserPlan(identity.id, selectedPlan)
      if ('success' in res) setPlan(selectedPlan)
      return res
    })
  }

  async function handleCoupon() {
    if (!identity.stripe_customer_id) {
      setMsg({ text: 'No Stripe customer on this account.', ok: false })
      return
    }
    await doAction(`Coupon ${selectedCoupon} applied`, () => applyAdminCoupon(identity.stripe_customer_id!, selectedCoupon))
  }

  async function handleSuspend() {
    if (!confirm(`Suspend ${identity.handle ?? identity.clerk_user_id}?`)) return
    await doAction('Account suspended', async () => {
      const res = await suspendUser(identity.id)
      if ('success' in res) setPlan('suspended')
      return res
    })
  }

  async function handleRestore() {
    await doAction('Account restored to free', async () => {
      const res = await restoreUser(identity.id)
      if ('success' in res) setPlan('free')
      return res
    })
  }

  async function handleDelete() {
    if (!confirm(`PERMANENTLY delete ${identity.handle ?? identity.clerk_user_id}? This cannot be undone.`)) return
    await doAction('Account deleted', () => deleteUserAccount(identity.id, identity.clerk_user_id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <Link href="/admin" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--mono)' }}>← Admin</Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          {identity.handle ?? identity.clerk_user_id}
        </h1>
        <span style={{
          fontSize: 10, color: PLAN_COLOR[plan] ?? 'var(--text-muted)',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${PLAN_COLOR[plan] ?? 'var(--border)'}`,
          borderRadius: 3, padding: '2px 8px', fontFamily: 'var(--mono)', letterSpacing: '0.08em',
        }}>
          {plan.toUpperCase()}
        </span>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12,
          fontFamily: 'var(--mono)', background: msg.ok ? 'rgba(74,189,160,0.08)' : 'rgba(224,123,82,0.08)',
          border: `1px solid ${msg.ok ? 'rgba(74,189,160,0.3)' : 'rgba(224,123,82,0.3)'}`,
          color: msg.ok ? 'var(--success)' : 'var(--error)',
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
        {/* Identity */}
        <Panel title="Identity">
          <Row label="Handle" value={identity.handle ?? '—'} />
          <Row label="Clerk ID" value={<span style={{ fontSize: 11, opacity: 0.6 }}>{identity.clerk_user_id}</span>} />
          <Row label="Plan" value={<span style={{ color: PLAN_COLOR[plan] }}>{plan}</span>} />
          <Row label="Stripe customer" value={identity.stripe_customer_id ? <span style={{ fontSize: 11 }}>{identity.stripe_customer_id}</span> : <span style={{ color: 'var(--text-muted)' }}>none</span>} />
          <Row label="Joined" value={formatDate(identity.created_at)} />
        </Panel>

        {/* Usage */}
        <Panel title="Usage">
          <Row label="JYSON (this month)" value={String(usage.jysonMo)} />
          <Row label="JYSON (all time)" value={String(usage.jysonTotal)} />
          <Row label="Registry writes" value={String(usage.registryTotal)} />
        </Panel>
      </div>

      {/* Plan management */}
      <Panel title="Change plan">
        <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 5,
              color: 'var(--text)', padding: '7px 12px', fontSize: 13, fontFamily: 'var(--mono)', cursor: 'pointer',
            }}
          >
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={handlePlanChange}
            disabled={loading !== null || selectedPlan === plan}
            style={{
              padding: '8px 16px', borderRadius: 5, border: 'none',
              background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12,
              fontFamily: 'var(--mono)', cursor: 'pointer', opacity: selectedPlan === plan ? 0.4 : 1,
            }}
          >
            {loading === 'Plan updated' ? 'Saving…' : 'Apply plan'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            Current: <strong>{plan}</strong>
          </span>
        </div>
      </Panel>

      {/* Coupon */}
      <Panel title="Apply coupon">
        <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={selectedCoupon}
            onChange={(e) => setSelectedCoupon(e.target.value)}
            style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 5,
              color: 'var(--text)', padding: '7px 12px', fontSize: 13, fontFamily: 'var(--mono)', cursor: 'pointer',
            }}
          >
            {COUPONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleCoupon}
            disabled={loading !== null || !identity.stripe_customer_id}
            style={{
              padding: '8px 16px', borderRadius: 5, border: 'none',
              background: '#7C6CF8', color: '#fff', fontSize: 12,
              fontFamily: 'var(--mono)', cursor: 'pointer',
              opacity: !identity.stripe_customer_id ? 0.4 : 1,
            }}
          >
            {loading?.startsWith('Coupon') ? 'Applying…' : 'Apply coupon'}
          </button>
          {!identity.stripe_customer_id && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Requires Stripe customer</span>
          )}
        </div>
      </Panel>

      {/* Account actions */}
      <Panel title="Account actions">
        <div style={{ padding: '14px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {plan === 'suspended' ? (
            <button onClick={handleRestore} disabled={loading !== null} style={{ padding: '8px 16px', borderRadius: 5, border: '1px solid rgba(74,189,160,0.3)', background: 'rgba(74,189,160,0.08)', color: 'var(--success)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer' }}>
              Restore account
            </button>
          ) : (
            <button onClick={handleSuspend} disabled={loading !== null || plan === 'founder'} style={{ padding: '8px 16px', borderRadius: 5, border: '1px solid rgba(201,164,106,0.3)', background: 'rgba(201,164,106,0.06)', color: 'var(--gold)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer', opacity: plan === 'founder' ? 0.4 : 1 }}>
              Suspend account
            </button>
          )}
          <button onClick={handleDelete} disabled={loading !== null || plan === 'founder'} style={{ padding: '8px 16px', borderRadius: 5, border: '1px solid rgba(224,123,82,0.3)', background: 'rgba(224,123,82,0.06)', color: 'var(--error)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer', opacity: plan === 'founder' ? 0.4 : 1 }}>
            Delete account
          </button>
          {plan === 'founder' && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>Founder accounts are protected.</span>}
        </div>
      </Panel>

      {/* Recent events */}
      {recentEvents.length > 0 && (
        <Panel title="Recent activity">
          <div style={{ padding: '8px 0' }}>
            {recentEvents.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{e.type}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{formatDate(e.ts)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
