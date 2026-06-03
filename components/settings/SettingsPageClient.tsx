'use client'

import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import PlatformSettings from '@/components/platform/PlatformSettings'

export default function SettingsPageClient() {
  return (
    <AccessAppLayout variant="default">
      <PlatformSettings />
    </AccessAppLayout>
  )
}
