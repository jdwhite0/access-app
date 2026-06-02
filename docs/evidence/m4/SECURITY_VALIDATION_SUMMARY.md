# M4 Security Validation Summary

**Date:** 2026-06-02  
**Scope:** Connector package + cloud path (attempted)

## Passed

- **Connector has zero service-role access** — ripgrep over `packages/access-connector` found no `SERVICE_ROLE`, `service_role`, or `createSupabaseAdmin`.
- **Local scan is metadata-only** — paths, sizes, mtimes; excludes `.env`, secrets, `node_modules`, `.git`.
- **Sync plan validator** rejects absolute paths (`/Users/`), `.env`, and oversized fields (server-side when apply runs).
- **Vercel does not read `ACCESS_VAULT_ROOT`** — no server code path reads user vault root for sync.

## Not validated (blocked)

- Device JWT authentication end-to-end (pairing table missing).
- RLS enforcement via tenant Supabase JWT (`SUPABASE_JWT_SECRET` + anon key not configured).
- Cross-tenant denial (no cloud writes).
- Audit log immutability chain ( `sync_audit_events` table missing).

## Attack surface (unchanged from Phase 4 review)

- Pairing code brute force — mitigate with TTL + rate limit (M5).
- Server service role compromise — operational secret hygiene.
- Stolen device token — rotation + revoke APIs implemented; not exercised in this run.

## Conclusion

**Local connector security model is sound.** **Cloud security controls cannot be validated** until Supabase Phase 3/4 schema is applied and M4 E2E is re-run.
