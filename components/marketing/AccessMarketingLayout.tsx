'use client'

import '@/lib/design-system/styles/marketing-home.css'
import '@/lib/design-system/styles/marketing-home-v2.css'

type Props = {
  children: React.ReactNode
}

/** Public marketing shell — no app sidebar, white header surface. */
export default function AccessMarketingLayout({ children }: Props) {
  return <div className="access-marketing-root">{children}</div>
}
