import UnsubscribePageClient from '@/components/legal/UnsubscribePageClient'

export const metadata = {
  title: 'Unsubscribe — ACCESS',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams
  return <UnsubscribePageClient token={params.token ?? null} />
}
