import { auth } from '@clerk/nextjs/server'
import JysonLandingClient from '@/components/jyson/JysonLandingClient'

export const metadata = {
  title: 'JYSON — Your AI Operator',
  description: 'Turn what you already possess into systems that grow. JYSON is your AI operator, powered by JD AI Systems.',
}

export default async function JysonPage() {
  const { userId } = await auth()
  return <JysonLandingClient isSignedIn={!!userId} />
}
