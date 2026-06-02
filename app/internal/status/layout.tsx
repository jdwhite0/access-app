import CommandCenterChrome from '@/components/navigation/CommandCenterChrome'

export default function InternalStatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CommandCenterChrome>{children}</CommandCenterChrome>
}
