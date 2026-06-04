import type { AccessPageContext } from '@/lib/access/page-context'
import type {
  JysonProcessingError,
  JysonProcessingPhase,
} from '@/lib/jyson-layer/processing-states'
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
  /** Drawer expanded (not collapsed to orb) */
  open: boolean
  /** Orb-only mode — main workspace stays full width */
  collapsed: boolean
  setOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
  toggle: () => void
  messages: JysonLayerMessage[]
  busy: boolean
  /** True from submit until stream completes or error is shown */
  isProcessing: boolean
  /** Message id the active processing card sits under */
  processingAnchorId: string | null
  processingPhase: JysonProcessingPhase
  processingError: JysonProcessingError | null
  isStreaming: boolean
  submit: (text: string) => Promise<void>
  retryLastSubmit: () => void
  contextLine: string
  greeting: string
  summary: RegistrySummary | null
  summaryLoading: boolean
  route: JysonRouteContext
  displayName: string | null
  layerInsight: string
  pageContext: AccessPageContext
}
