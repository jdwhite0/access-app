import type { RegistrySummary } from '@/types/db'
import type { PrimaryNavId } from '@/lib/navigation/types'

export type JysonLayerMessage = {
  id: string
  role: 'user' | 'jyson'
  text: string
}

export type JysonRouteContext = {
  pathname: string
  primary: PrimaryNavId | null
  projectId: string | null
  companionSection: string | null
  settingsSection: string | null
}

export type JysonLayerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  messages: JysonLayerMessage[]
  busy: boolean
  submit: (text: string) => Promise<void>
  contextLine: string
  greeting: string
  summary: RegistrySummary | null
  summaryLoading: boolean
  route: JysonRouteContext
  displayName: string | null
  layerInsight: string
}
