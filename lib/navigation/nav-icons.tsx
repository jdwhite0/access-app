import {
  LayoutDashboard,
  User,
  FolderKanban,
  Sparkles,
  Users,
  Brain,
  Network,
  Package,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { PrimaryNavItem } from './types'

const ICONS: Record<PrimaryNavItem['id'], LucideIcon> = {
  home: LayoutDashboard,
  founder: User,
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
