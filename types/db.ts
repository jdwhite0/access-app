export type SystemType = 'ai' | 'business' | 'content' | 'knowledge'
export type StatusType = 'active' | 'inactive' | 'archived'
export type ActivationStatus = 'registered' | 'activating' | 'active'

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
  owner_handle: string        // e.g., "jdwhite.access"
  system_handle: string       // e.g., "jdproductions.access"
  name: string                // e.g., "JD Productions OS"
  type: SystemType
  description: string | null
  status: StatusType
  activation_status: ActivationStatus  // registered → activating → active
  capabilities: string[]               // what this entity can do
  connections: string[]                // system handles this entity connects to
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

export interface SystemFile {
  id: string
  system_id: string | null
  clerk_user_id: string
  filename: string | null
  file_type: string | null
  url: string | null
  created_at: string
}

export interface AccessKeyPreview {
  id: string
  clerk_user_id: string
  owner_handle: string
  key_string: string    // e.g., "jdproductions.access"
  status: 'reserved' | 'active' | 'inactive'
  created_at: string
}
