export type SystemType       = 'ai' | 'business' | 'content' | 'knowledge'
export type StatusType       = 'active' | 'inactive' | 'archived'
export type ActivationStatus = 'registered' | 'activating' | 'active'
export type AssetType        = 'code' | 'content' | 'creative' | 'data' | 'document' | 'brand' | 'other'
export type VaultType        = 'obsidian' | 'notion' | 'drive' | 'local' | 'other'
export type OfferStatus      = 'draft' | 'active' | 'paused' | 'archived'

export interface Profile {
  id: string
  clerk_user_id: string
  access_handle: string | null
  created_at: string
}

export interface AccessIdentity {
  id: string
  clerk_user_id: string
  handle: string       // e.g., "jdwhite.access"
  status: StatusType
  created_at: string
}

export interface System {
  id: string
  clerk_user_id: string
  owner_handle: string
  system_handle: string
  name: string
  type: SystemType
  description: string | null
  status: StatusType
  activation_status: ActivationStatus
  capabilities: string[]
  connections: string[]
  blueprint_id: string | null
  created_at: string
}

export interface Blueprint {
  id: string
  clerk_user_id: string
  owner_handle: string
  type: SystemType
  answers: string[]
  system_id: string | null
  created_at: string
}

export interface Agent {
  id: string
  clerk_user_id: string
  owner_handle: string
  name: string
  description: string | null
  role: string | null
  system_id: string | null
  status: StatusType
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  clerk_user_id: string
  owner_handle: string
  name: string
  description: string | null
  asset_type: AssetType
  url: string | null
  status: StatusType
  created_at: string
  updated_at: string
}

export interface Workflow {
  id: string
  clerk_user_id: string
  owner_handle: string
  name: string
  description: string | null
  trigger: string | null
  system_id: string | null
  status: StatusType
  created_at: string
  updated_at: string
}

export interface Vault {
  id: string
  clerk_user_id: string
  owner_handle: string
  name: string
  description: string | null
  vault_type: VaultType | null
  status: StatusType
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  clerk_user_id: string
  owner_handle: string
  name: string
  description: string | null
  delivery: string | null
  pricing: string | null
  status: OfferStatus
  system_id: string | null
  created_at: string
  updated_at: string
}

export interface SystemFile {
  id: string
  system_id: string | null
  clerk_user_id: string
  filename: string | null
  file_type: string | null
  url: string | null
  created_at: string
}

export interface Task {
  text: string
  completed: boolean
}

export interface Milestone {
  text: string
  completed: boolean
}

export interface BuilderProject {
  id: string
  clerk_user_id: string
  owner_handle: string
  system_id: string | null
  name: string
  objective: string | null
  status: 'active' | 'completed' | 'archived'
  milestones: Milestone[]
  tasks: Task[]
  stack: string[]
  assets: string[]
  architecture: string | null
  created_at: string
  updated_at: string
}

export interface AccessKeyPreview {
  id: string
  clerk_user_id: string
  owner_handle: string
  key_string: string
  status: 'reserved' | 'active' | 'inactive'
  created_at: string
}

/* ─── Registry summary ─────────────────────────────────────── */
export interface RegistryCounts {
  systems: number
  agents: number
  projects: number
  blueprints: number
  assets: number
  workflows: number
  vaults: number
  connections: number
  offers: number
}

export interface RegistrySummary {
  identityHandle: string
  identityCreatedAt: string | null
  counts: RegistryCounts
  totalRegistered: number
}
