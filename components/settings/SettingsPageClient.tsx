'use client'

import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'

export default function SettingsPageClient() {
  return (
    <AccessAppLayout variant="default">
      <div className="access-os-workspace" style={{ padding: '28px 32px 40px' }}>
        <header className="access-os-workspace-header">
          <p className="access-os-workspace-eyebrow">ACCESS OS</p>
          <h1 className="access-os-workspace-title">Settings</h1>
          <p className="access-os-workspace-sub">
            Operator tools and platform surfaces. Use the section menu for quick
            access.
          </p>
        </header>

        <div className="access-os-placeholder-grid">
          <Link href="/internal/command-center" className="access-os-placeholder-card access-os-stat-card">
            <span className="access-os-placeholder-label">Command Center</span>
            <span className="access-os-placeholder-value">◈</span>
          </Link>
          <Link href="/internal/status" className="access-os-placeholder-card access-os-stat-card">
            <span className="access-os-placeholder-label">Internal Status</span>
            <span className="access-os-placeholder-value">◇</span>
          </Link>
          <Link href="/status" className="access-os-placeholder-card access-os-stat-card">
            <span className="access-os-placeholder-label">Public Status</span>
            <span className="access-os-placeholder-value">▸</span>
          </Link>
        </div>
      </div>
    </AccessAppLayout>
  )
}
