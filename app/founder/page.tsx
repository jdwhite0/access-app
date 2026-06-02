import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import FounderBlueprintWizard from '@/components/founder/FounderBlueprintWizard'

export const metadata = {
  title: 'Founder Blueprint — ACCESS',
  description: 'Create and export your canonical Founder Blueprint.',
}

export default async function FounderPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=founder')

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
        <FounderBlueprintWizard />
      </Suspense>
    </div>
  )
}
