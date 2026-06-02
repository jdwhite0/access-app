-- ACCESS Phase 3 — Platform Foundation (vault, sync, connector devices, provenance)
-- Apply AFTER schema.sql + schema_v2.sql in Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- No file bodies. No absolute paths. No secrets.

-- ────────────────────────────────────────────────────────────
-- updated_at helper (vault_connections, connector_devices)
-- ────────────────────────────────────────────────────────────
create or replace function public.access_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- vault_connections
-- ────────────────────────────────────────────────────────────
create table if not exists public.vault_connections (
  id                uuid primary key default gen_random_uuid(),
  identity_id       uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id     text not null,
  vault_key         text not null,
  display_name      text not null,
  connector_type    text not null default 'local_connector',
  status            text not null default 'pending_connector',
  last_seen_at      timestamptz,
  last_sync_at      timestamptz,
  last_sync_status  text,
  config            jsonb not null default '{}'::jsonb,
  root_label        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint vault_connections_identity_vault_key unique (identity_id, vault_key),
  constraint vault_connections_status_check check (
    status in (
      'pending_connector',
      'connected',
      'syncing',
      'stale',
      'disconnected',
      'revoked',
      'error'
    )
  )
);

create index if not exists idx_vault_connections_clerk on public.vault_connections(clerk_user_id);
create index if not exists idx_vault_connections_identity on public.vault_connections(identity_id);
create index if not exists idx_vault_connections_status on public.vault_connections(clerk_user_id, status);

drop trigger if exists vault_connections_set_updated_at on public.vault_connections;
create trigger vault_connections_set_updated_at
  before update on public.vault_connections
  for each row execute function public.access_set_updated_at();

-- Upgrade path: older 3a rows may have machine_id — drop if present (optional, non-breaking)
alter table public.vault_connections drop column if exists machine_id;

-- ────────────────────────────────────────────────────────────
-- sync_runs
-- ────────────────────────────────────────────────────────────
create table if not exists public.sync_runs (
  id                  uuid primary key default gen_random_uuid(),
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id       text not null,
  vault_connection_id uuid references public.vault_connections(id) on delete set null,
  run_type            text not null default 'manual',
  status              text not null default 'started',
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  stats               jsonb not null default '{}'::jsonb,
  error_message       text,
  created_at          timestamptz not null default now(),
  constraint sync_runs_status_check check (
    status in ('started', 'completed', 'failed', 'cancelled')
  )
);

-- Migrate legacy column names from early 3a drafts
alter table public.sync_runs add column if not exists identity_id uuid references public.access_identities(id) on delete cascade;
alter table public.sync_runs add column if not exists completed_at timestamptz;
alter table public.sync_runs drop column if exists finished_at;

create index if not exists idx_sync_runs_vault on public.sync_runs(vault_connection_id);
create index if not exists idx_sync_runs_clerk on public.sync_runs(clerk_user_id);
create index if not exists idx_sync_runs_identity on public.sync_runs(identity_id);
create index if not exists idx_sync_runs_started on public.sync_runs(identity_id, started_at desc);

-- ────────────────────────────────────────────────────────────
-- connector_devices (device-scoped, revocable — token_hash only in cloud)
-- ────────────────────────────────────────────────────────────
create table if not exists public.connector_devices (
  id                  uuid primary key default gen_random_uuid(),
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id         text not null,
  vault_connection_id uuid references public.vault_connections(id) on delete set null,
  device_name         text,
  machine_id          text,
  public_key          text,
  token_hash          text,
  status              text not null default 'pending',
  last_seen_at        timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint connector_devices_status_check check (
    status in ('pending', 'active', 'revoked', 'error')
  )
);

create index if not exists idx_connector_devices_identity on public.connector_devices(identity_id);
create index if not exists idx_connector_devices_clerk on public.connector_devices(clerk_user_id);
create index if not exists idx_connector_devices_vault on public.connector_devices(vault_connection_id);
create index if not exists idx_connector_devices_machine on public.connector_devices(identity_id, machine_id);

drop trigger if exists connector_devices_set_updated_at on public.connector_devices;
create trigger connector_devices_set_updated_at
  before update on public.connector_devices
  for each row execute function public.access_set_updated_at();

-- ────────────────────────────────────────────────────────────
-- Registry provenance columns
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
      'alter table public.%I add column if not exists sync_version integer default 1',
      t
    );
    execute format(
      'alter table public.%I add column if not exists last_synced_at timestamptz',
      t
    );
    execute format(
      'alter table public.%I add column if not exists visibility text default ''private''',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (identity_id)',
      'idx_' || t || '_identity_id', t
    );
    execute format(
      'create index if not exists %I on public.%I (vault_connection_id)',
      'idx_' || t || '_vault_connection_id', t
    );
    execute format(
      'create unique index if not exists %I on public.%I (identity_id, source_ref) where source_ref is not null',
      'idx_' || t || '_identity_source_ref', t
    );
  end loop;
end $$;
