import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Users,
  Brain,
  Package,
  Network,
  Settings,
  Cpu,
  Boxes,
  UserCheck,
  ShieldCheck,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import type { PrimaryNavItem } from './types'

const ICONS: Record<PrimaryNavItem['id'], LucideIcon> = {
  // Legacy IDs (backward compat)
  home:         LayoutDashboard,
  projects:     FolderKanban,
  companion:    Sparkles,
  agents:       Users,
  memory:       Brain,
  offers:       Package,
  registry:     Network,
  settings:     Settings,
  // New outcome-based IDs
  systems:      Cpu,
  assets:       Boxes,
  customers:    UserCheck,
  intelligence: Sparkles,
  knowledge:    Brain,
  team:         Users,
  platform:     Settings,
  admin:        ShieldCheck,
  terminal:     Terminal,
}

export function navIconFor(id: PrimaryNavItem['id']): LucideIcon {
  return ICONS[id] ?? LayoutDashboard
}
