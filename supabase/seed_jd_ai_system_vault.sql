-- Seed: JD_AI_System intelligence vault for Jerry's ACCESS identity
-- Run AFTER schema_v3_vault.sql and after jerry.access (or jdwhite.access) exists in access_identities.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

insert into public.vault_connections (
  identity_id,
  clerk_user_id,
  vault_key,
  display_name,
  connector_type,
  status,
  root_label,
  config
)
select
  ai.id,
  ai.clerk_user_id,
  'JD_AI_System',
  'JD_AI_System Intelligence Vault',
  'local_connector',
  'connected',
  'Private intelligence vault (local Mac)',
  '{"compileProfile":"jd_operator_full"}'::jsonb
from public.access_identities ai
where ai.handle in ('jerry.access', 'jdwhite.access', 'jdwhite0.access')
on conflict (identity_id, vault_key) do update set
  display_name = excluded.display_name,
  connector_type = excluded.connector_type,
  status = excluded.status,
  updated_at = now();
