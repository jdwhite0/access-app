export type ConnectorPermission =
  | 'heartbeat'
  | 'sync:apply'
  | 'sync:enqueue'

export type ConnectorDeviceClaims = {
  sub: string
  identity_id: string
  clerk_user_id: string
  vault_connection_id: string
  vault_key: string
  permissions: ConnectorPermission[]
  jti: string
}

export type VerifiedConnectorDevice = ConnectorDeviceClaims & {
  iat: number
  exp: number
}
