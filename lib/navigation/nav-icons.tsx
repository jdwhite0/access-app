import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Users,
  Brain,
  Package,
  Network,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { PrimaryNavItem } from './types'

const ICONS: Record<PrimaryNavItem['id'], LucideIcon> = {
  home: LayoutDashboard,
  projects: FolderKanban,
  companion: Sparkles,
  agents: Users,
  memory: Brain,
  offers: Package,
  registry: Network,
  settings: Settings,
}

export function navIconFor(id: PrimaryNavItem['id']): LucideIcon {
  return ICONS[id] ?? LayoutDashboard
}
