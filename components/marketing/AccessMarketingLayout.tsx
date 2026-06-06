'use client'

import '@/lib/design-system/styles/marketing-home.css'
import '@/lib/design-system/styles/marketing-home-v2.css'
import AnimatedCanvas from './AnimatedCanvas'

type Props = {
  children: React.ReactNode
}

/** Public marketing shell — no app sidebar, white header surface. */
export default function AccessMarketingLayout({ children }: Props) {
  return (
    <div className="access-marketing-root">
      <AnimatedCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
