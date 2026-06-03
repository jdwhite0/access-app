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
    <Suspense fallback={null}>
      <TerminalShell />
    </Suspense>
  )
}
