'use client'

import type { ReactNode } from 'react'
import AccessAppLayout from './AccessAppLayout'

export default function CommandCenterChrome({ children }: { children: ReactNode }) {
  return <AccessAppLayout variant="default">{children}</AccessAppLayout>
}
