import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import TerminalShell from '@/components/terminal/TerminalShell'

export const metadata = {
  title: 'Terminal — ACCESS OS',
  description: 'ACCESS OS command terminal. Command your JYSON companion and AI infrastructure.',
}

export default async function TerminalPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

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
      <Suspense fallback={null}>
        <TerminalShell />
      </Suspense>
    </div>
  )
}
