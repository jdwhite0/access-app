'use client'

import AnimatedCanvas from '@/components/marketing/AnimatedCanvas'

export default function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnimatedCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </>
  )
}
