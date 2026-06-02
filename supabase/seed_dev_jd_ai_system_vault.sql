-- DEV ONLY: Jerry / operator vault link (JD_AI_System)
-- Run after schema_v3_vault.sql. Safe to re-run.
-- Production users get primary_vault via app provisioning (lib/vault/provision.ts).

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
  'pending_connector',
  'Private intelligence vault',
  '{"vaultType":"local_intelligence_vault","compileProfile":"jd_operator_full"}'::jsonb
from public.access_identities ai
where ai.handle in ('jerry.access', 'jdwhite.access', 'jdwhite0.access')
on conflict (identity_id, vault_key) do update set
  display_name = excluded.display_name,
  connector_type = excluded.connector_type,
  root_label = excluded.root_label,
  config = excluded.config,
  updated_at = now();
