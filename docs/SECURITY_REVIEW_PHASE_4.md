# Phase 4 — Security review & attack surface

## Trust boundaries

| Zone | Trust level | Access |
|------|-------------|--------|
| User browser (Clerk) | High | Pairing code creation only |
| Connector process | Medium | Device JWT only; local vault read |
| Next.js API (`/api/connector/v1/*`) | Controlled | JWT middleware + ownership guards |
| Supabase (service role) | Server-only | Never in connector binary/env |

## Attack surface analysis

### External endpoints (new)

| Endpoint | Auth | Risk | Mitigation |
|----------|------|------|------------|
| `POST .../devices/register` | Pairing code | Code guessing | Short TTL, single-use, rate limit |
| `POST .../heartbeat` | Device JWT | Token replay | `jti` + `token_hash`, expiry |
| `POST .../devices/rotate` | Device JWT | Token theft window | Invalidate old `jti` on rotate |
| `POST .../devices/revoke` | Clerk or device | Unauthorized revoke | Clerk owns device; device can self-revoke |
| `POST .../sync/apply` | Device JWT + `sync:apply` | Cross-tenant write | Guards on identity + vault |
| `POST .../sync/enqueue` | Device JWT | Queue flooding | Max payload rows, rate limit |

### Removed surfaces

- Connector loading `SUPABASE_SERVICE_ROLE_KEY` — **removed** from connector package.
- Direct Supabase writes from connector — **blocked**.

### Residual risks (accepted for operator phase)

| Risk | Severity | Follow-up |
|------|----------|-----------|
| Server service role compromise | Critical | Vault secrets in Vercel; rotate keys; audit logs |
| RLS + admin client | Medium | Context RPC on every apply; migrate to user JWT later |
| Pairing code in logs | Low | Never log full code |
| Sync plan tampering | Medium | Server re-validates paths, hashes, sizes |

## RLS policy summary

Tables with `ENABLE ROW LEVEL SECURITY` + policy `identity_id = access_current_identity_id()`:

- `vault_connections`, `connector_devices`, `sync_runs`, `sync_jobs`, `sync_audit_events`
- Registry: `systems`, `agents`, `builder_projects`, `blueprints`, `assets`, `workflows`, `vaults`, `offers`

Service role bypasses RLS in Supabase by default — **application must call `access_set_request_context`** before tenant writes.

## Connector permissions

| Permission | Allows |
|------------|--------|
| `heartbeat` | Update `last_seen_at` |
| `sync:apply` | Apply approved metadata plan |
| `sync:enqueue` | Queue async sync job |

Default device: `heartbeat`, `sync:apply`, `sync:enqueue`.

## Pre-launch checklist

- [ ] `ACCESS_CONNECTOR_JWT_SECRET` set (32+ bytes random)
- [ ] Pairing codes never committed
- [ ] `schema_v4` applied in Supabase
- [ ] E2E sync proof script passes
- [ ] No service role in connector env
