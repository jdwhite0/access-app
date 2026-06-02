-- ACCESS Intelligence Vault — Schema v3 (Phase 3a)
-- Run in Supabase SQL Editor after schema.sql + schema_v2.sql
-- Additive only. No absolute paths. No file bodies.

-- ────────────────────────────────────────────────────────────
-- vault_connections
-- Links an ACCESS identity to a logical intelligence vault.
-- ────────────────────────────────────────────────────────────
create table if not exists public.vault_connections (
  id                uuid primary key default gen_random_uuid(),
  identity_id       uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id     text not null,
  vault_key         text not null,
  display_name      text not null,
  connector_type    text not null default 'local_connector',
  status            text not null default 'pending_connector',
  root_label        text,
  machine_id        text,
  last_seen_at      timestamptz,
  last_sync_at      timestamptz,
  last_sync_status  text,
  config            jsonb default '{}'::jsonb,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null,
  unique (identity_id, vault_key)
);

create index if not exists idx_vault_connections_clerk on public.vault_connections(clerk_user_id);
create index if not exists idx_vault_connections_identity on public.vault_connections(identity_id);

-- ────────────────────────────────────────────────────────────
-- sync_runs
-- Audit trail for connector compile jobs (Phase 3b+).
-- ────────────────────────────────────────────────────────────
create table if not exists public.sync_runs (
  id                  uuid primary key default gen_random_uuid(),
  vault_connection_id uuid not null references public.vault_connections(id) on delete cascade,
  clerk_user_id       text not null,
  run_type            text not null default 'delta',
  status              text not null default 'pending',
  started_at          timestamptz default now() not null,
  finished_at         timestamptz,
  stats               jsonb default '{}'::jsonb,
  error_message       text,
  created_at          timestamptz default now() not null
);

create index if not exists idx_sync_runs_vault on public.sync_runs(vault_connection_id);
create index if not exists idx_sync_runs_clerk on public.sync_runs(clerk_user_id);

-- ────────────────────────────────────────────────────────────
-- Registry provenance columns (connector sync metadata)
-- ────────────────────────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'systems', 'agents', 'builder_projects', 'blueprints',
    'assets', 'workflows', 'vaults', 'offers'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column if not exists identity_id uuid references public.access_identities(id) on delete set null',
      t
    );
    execute format(
      'alter table public.%I add column if not exists vault_connection_id uuid references public.vault_connections(id) on delete set null',
      t
    );
    execute format(
      'alter table public.%I add column if not exists source_kind text default ''native''',
      t
    );
    execute format(
      'alter table public.%I add column if not exists source_vault_key text',
      t
    );
    execute format(
      'alter table public.%I add column if not exists source_path text',
      t
    );
    execute format(
      'alter table public.%I add column if not exists source_ref text',
      t
    );
    execute format(
      'alter table public.%I add column if not exists content_hash text',
      t
    );
    execute format(
      'alter table public.%I add column if not exists sync_version int default 0',
      t
    );
    execute format(
      'alter table public.%I add column if not exists last_synced_at timestamptz',
      t
    );
    execute format(
      'alter table public.%I add column if not exists visibility text default ''cloud_metadata''',
      t
    );
  end loop;
end $$;
