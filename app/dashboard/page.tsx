'use client'

import AccessOsSignedInPage from '@/components/os/AccessOsSignedInPage'

export default function DashboardPage() {
  return (
    <div className="relative h-full scanline">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(64,192,208,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,192,208,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <AccessOsSignedInPage module="dashboard" />
    </div>
  )
}
