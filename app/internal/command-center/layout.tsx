import CommandCenterChrome from '@/components/navigation/CommandCenterChrome'

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CommandCenterChrome>{children}</CommandCenterChrome>
}
