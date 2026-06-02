-- ACCESS Phase 4 — Platform Hardening
-- Apply AFTER schema.sql, schema_v2.sql, schema_v3_vault.sql
-- Safe to re-run where noted (IF NOT EXISTS / policies via drop/create)
--
-- ORDER RULE: All helper functions MUST exist before any trigger, RPC, or RLS
-- policy references them. Run this entire file top-to-bottom in one pass.

-- ════════════════════════════════════════════════════════════
-- SECTION 1 — Helper functions (required before all DDL below)
-- ════════════════════════════════════════════════════════════

-- From v3 (idempotent): sync_jobs / vault_connections updated_at triggers
create or replace function public.access_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Session context readers (used by RLS policies in SECTION 6)
create or replace function public.access_current_identity_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('access.identity_id', true), '')::uuid;
$$;

create or replace function public.access_current_clerk_user_id()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('access.clerk_user_id', true), '');
$$;

-- Session context writer (server calls before tenant-scoped writes)
create or replace function public.access_set_request_context(
  p_identity_id uuid,
  p_clerk_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('access.identity_id', p_identity_id::text, true);
  perform set_config('access.clerk_user_id', p_clerk_user_id, true);
end;
$$;

-- PostgREST / Supabase client RPC exposure (required for platform:verify-m0)
grant execute on function public.access_current_identity_id() to service_role;
grant execute on function public.access_current_clerk_user_id() to service_role;
grant execute on function public.access_set_request_context(uuid, text) to service_role;
grant execute on function public.access_set_request_context(uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════
-- SECTION 2 — Tables, indexes, constraints
-- ════════════════════════════════════════════════════════════

-- Pairing codes (device registration without service role on connector)
create table if not exists public.connector_pairing_codes (
  code                text primary key,
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id       text not null,
  vault_connection_id uuid references public.vault_connections(id) on delete cascade,
  created_by_clerk    text not null,
  expires_at          timestamptz not null,
  consumed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_pairing_codes_identity on public.connector_pairing_codes(identity_id);
create index if not exists idx_pairing_codes_expires on public.connector_pairing_codes(expires_at);

-- ────────────────────────────────────────────────────────────
-- Connector device enhancements
-- ────────────────────────────────────────────────────────────
alter table public.connector_devices
  add column if not exists permissions jsonb not null default '["heartbeat","sync:apply","sync:enqueue"]'::jsonb;

alter table public.connector_devices
  add column if not exists token_jti text;

alter table public.connector_devices
  add column if not exists token_expires_at timestamptz;

alter table public.connector_devices
  add column if not exists last_token_rotated_at timestamptz;

create unique index if not exists idx_connector_devices_active_jti
  on public.connector_devices (token_jti)
  where token_jti is not null and status = 'active';

-- ────────────────────────────────────────────────────────────
-- Sync audit events
-- ────────────────────────────────────────────────────────────
create table if not exists public.sync_audit_events (
  id                  uuid primary key default gen_random_uuid(),
  sync_run_id         uuid references public.sync_runs(id) on delete cascade,
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id       text not null,
  vault_connection_id uuid references public.vault_connections(id) on delete set null,
  connector_device_id uuid references public.connector_devices(id) on delete set null,
  event_type          text not null,
  object_type         text,
  source_ref          text,
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  constraint sync_audit_events_type_check check (
    event_type in (
      'run_started', 'run_completed', 'run_failed', 'run_cancelled',
      'row_upserted', 'row_skipped', 'row_conflict', 'rollback_applied'
    )
  )
);

create index if not exists idx_sync_audit_run on public.sync_audit_events(sync_run_id);
create index if not exists idx_sync_audit_identity on public.sync_audit_events(identity_id, created_at desc);

-- ────────────────────────────────────────────────────────────
-- Async sync job queue (Phase 4D)
-- ────────────────────────────────────────────────────────────
create table if not exists public.sync_jobs (
  id                  uuid primary key default gen_random_uuid(),
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id       text not null,
  vault_connection_id uuid not null references public.vault_connections(id) on delete cascade,
  connector_device_id uuid references public.connector_devices(id) on delete set null,
  sync_run_id         uuid references public.sync_runs(id) on delete set null,
  status              text not null default 'pending',
  run_type            text not null default 'connector',
  payload             jsonb not null default '{}'::jsonb,
  attempts            integer not null default 0,
  max_attempts        integer not null default 5,
  scheduled_at        timestamptz not null default now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sync_jobs_status_check check (
    status in ('pending', 'processing', 'completed', 'failed', 'dead_letter', 'cancelled')
  )
);

create index if not exists idx_sync_jobs_pending on public.sync_jobs(status, scheduled_at)
  where status = 'pending';

create index if not exists idx_sync_jobs_identity on public.sync_jobs(identity_id, created_at desc);

drop trigger if exists sync_jobs_set_updated_at on public.sync_jobs;
create trigger sync_jobs_set_updated_at
  before update on public.sync_jobs
  for each row execute function public.access_set_updated_at();

-- ════════════════════════════════════════════════════════════
-- SECTION 3 — Scoped unique indexes (systems.system_handle)
-- ════════════════════════════════════════════════════════════
-- schema.sql creates UNIQUE on system_handle as a table constraint
-- (systems_system_handle_key), not a droppable standalone index.
do $$
begin
  alter table public.systems drop constraint if exists systems_system_handle_key;
exception
  when others then
    raise notice 'systems_system_handle_key drop skipped: %', sqlerrm;
end $$;

do $$
begin
  create unique index if not exists idx_systems_identity_system_handle
    on public.systems (identity_id, system_handle)
    where identity_id is not null;
exception
  when others then
    raise notice 'idx_systems_identity_system_handle skipped: %', sqlerrm;
end $$;

do $$
begin
  create unique index if not exists idx_systems_clerk_system_handle_legacy
    on public.systems (clerk_user_id, system_handle)
    where identity_id is null;
exception
  when others then
    raise notice 'idx_systems_clerk_system_handle_legacy skipped: %', sqlerrm;
end $$;

-- ════════════════════════════════════════════════════════════
-- SECTION 4 — RPCs (depend on SECTION 1 + v3 tables/columns)
-- ════════════════════════════════════════════════════════════
create or replace function public.get_registry_summary(p_identity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_clerk text;
  v_handle text;
  v_created timestamptz;
  v_vault jsonb;
  v_connections int;
  v_counts jsonb;
begin
  select clerk_user_id, handle, created_at
  into v_clerk, v_handle, v_created
  from public.access_identities
  where id = p_identity_id;

  if v_clerk is null then
    return null;
  end if;

  select jsonb_build_object(
    'vaultKey', vc.vault_key,
    'displayName', vc.display_name,
    'status', vc.status,
    'connectorType', vc.connector_type,
    'lastSeenAt', vc.last_seen_at,
    'lastSyncAt', vc.last_sync_at,
    'lastSyncStatus', vc.last_sync_status
  )
  into v_vault
  from public.vault_connections vc
  where vc.identity_id = p_identity_id
  order by case when vc.vault_key = 'JD_AI_System' then 0 when vc.vault_key = 'primary_vault' then 1 else 2 end,
           vc.updated_at desc
  limit 1;

  select count(*)::int into v_connections
  from public.vault_connections vc
  where vc.identity_id = p_identity_id
    and vc.status in ('connected', 'pending_connector', 'syncing', 'stale');

  v_counts := jsonb_build_object(
    'systems', (select count(*) from public.systems s where s.identity_id = p_identity_id and s.status = 'active'),
    'agents', (select count(*) from public.agents a where a.identity_id = p_identity_id and a.status = 'active'),
    'projects', (select count(*) from public.builder_projects p where p.identity_id = p_identity_id and p.status <> 'archived'),
    'blueprints', (select count(*) from public.blueprints b where b.identity_id = p_identity_id),
    'assets', (select count(*) from public.assets ast where ast.identity_id = p_identity_id and ast.status = 'active'),
    'workflows', (select count(*) from public.workflows w where w.identity_id = p_identity_id and w.status = 'active'),
    'vaults', (select count(*) from public.vaults v where v.identity_id = p_identity_id and v.status = 'active'),
    'connections', v_connections,
    'offers', (select count(*) from public.offers o where o.identity_id = p_identity_id and o.status <> 'archived')
  );

  return jsonb_build_object(
    'identityHandle', v_handle,
    'identityCreatedAt', v_created,
    'registryCounts', v_counts,
    'counts', v_counts,
    'connectionsCount', v_connections,
    'vaultConnection', v_vault,
    'syncStatus', coalesce(v_vault->>'lastSyncStatus', case when v_vault->>'lastSyncAt' is null then 'never' else v_vault->>'status' end)
  );
end;
$$;

-- ────────────────────────────────────────────────────────────
-- sync_runs retention helper (call from cron/worker)
-- ────────────────────────────────────────────────────────────
create or replace function public.prune_sync_runs(p_keep_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  with deleted as (
    delete from public.sync_runs
    where created_at < now() - (p_keep_days || ' days')::interval
      and status in ('completed', 'failed', 'cancelled')
    returning 1
  )
  select count(*) into v_deleted from deleted;
  return v_deleted;
end;
$$;

grant execute on function public.get_registry_summary(uuid) to service_role;
grant execute on function public.get_registry_summary(uuid) to authenticated;
grant execute on function public.prune_sync_runs(integer) to service_role;

-- ════════════════════════════════════════════════════════════
-- SECTION 5 — Backfill identity_id on registry rows
-- ════════════════════════════════════════════════════════════
do $$
declare
  t text;
  tables text[] := array[
    'systems', 'agents', 'builder_projects', 'blueprints',
    'assets', 'workflows', 'vaults', 'offers'
  ];
begin
  foreach t in array tables loop
    begin
      execute format(
        'update public.%I r
         set identity_id = ai.id
         from public.access_identities ai
         where r.clerk_user_id = ai.clerk_user_id
           and r.identity_id is null',
        t
      );
    exception
      when others then
        raise notice 'identity_id backfill skipped for %: %', t, sqlerrm;
    end;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
-- SECTION 6 — Row Level Security
-- ════════════════════════════════════════════════════════════
--
-- Re-declare session helpers immediately before policies (idempotent).
-- Required if an earlier partial run skipped SECTION 1 or the SQL editor
-- executed only from this block onward.
create or replace function public.access_current_identity_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('access.identity_id', true), '')::uuid;
$$;

create or replace function public.access_current_clerk_user_id()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('access.clerk_user_id', true), '');
$$;

create or replace function public.access_set_request_context(
  p_identity_id uuid,
  p_clerk_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('access.identity_id', p_identity_id::text, true);
  perform set_config('access.clerk_user_id', p_clerk_user_id, true);
end;
$$;

alter table public.vault_connections enable row level security;
alter table public.connector_devices enable row level security;
alter table public.sync_runs enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_audit_events enable row level security;
alter table public.systems enable row level security;
alter table public.agents enable row level security;
alter table public.builder_projects enable row level security;
alter table public.blueprints enable row level security;
alter table public.assets enable row level security;
alter table public.workflows enable row level security;
alter table public.vaults enable row level security;
alter table public.offers enable row level security;

-- Policies (tenant isolation via session context)
do $$
declare
  t text;
  tables text[] := array[
    'vault_connections', 'connector_devices', 'sync_runs', 'sync_jobs', 'sync_audit_events',
    'systems', 'agents', 'builder_projects', 'blueprints', 'assets', 'workflows', 'vaults', 'offers'
  ];
  pol text;
begin
  foreach t in array tables loop
    begin
      pol := t || '_tenant_isolation';
      execute format('drop policy if exists %I on public.%I', pol, t);
      execute format(
        'create policy %I on public.%I for all using (
          identity_id is not distinct from public.access_current_identity_id()
          and clerk_user_id is not distinct from public.access_current_clerk_user_id()
        ) with check (
          identity_id is not distinct from public.access_current_identity_id()
          and clerk_user_id is not distinct from public.access_current_clerk_user_id()
        )',
        pol, t
      );
    exception
      when others then
        raise notice 'RLS policy skipped for %: %', t, sqlerrm;
    end;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
-- SECTION 7 — Completion guarantees (partial-apply repair)
-- ════════════════════════════════════════════════════════════
-- Safe to re-run if an earlier attempt stopped mid-file (e.g. before pairing_codes).

create table if not exists public.connector_pairing_codes (
  code                text primary key,
  identity_id         uuid not null references public.access_identities(id) on delete cascade,
  clerk_user_id       text not null,
  vault_connection_id uuid references public.vault_connections(id) on delete cascade,
  created_by_clerk    text not null,
  expires_at          timestamptz not null,
  consumed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_pairing_codes_identity on public.connector_pairing_codes(identity_id);
create index if not exists idx_pairing_codes_expires on public.connector_pairing_codes(expires_at);

create or replace function public.access_set_request_context(
  p_identity_id uuid,
  p_clerk_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('access.identity_id', p_identity_id::text, true);
  perform set_config('access.clerk_user_id', p_clerk_user_id, true);
end;
$$;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.connector_pairing_codes to service_role;
grant execute on function public.access_set_request_context(uuid, text) to service_role;
grant execute on function public.access_set_request_context(uuid, text) to authenticated;
grant execute on function public.access_current_identity_id() to service_role;
grant execute on function public.access_current_clerk_user_id() to service_role;
grant execute on function public.get_registry_summary(uuid) to service_role;
grant execute on function public.get_registry_summary(uuid) to authenticated;

-- Refresh PostgREST schema cache (tables + RPC signatures)
notify pgrst, 'reload schema';
