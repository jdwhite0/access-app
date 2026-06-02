-- M2 — RLS via Supabase JWT claims (enforced for authenticated/anon clients; NOT service_role)
-- Apply after schema_v4_platform_hardening.sql

create or replace function public.access_jwt_identity_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'identity_id', '')::uuid;
$$;

create or replace function public.access_tenant_allowed(
  p_identity_id uuid,
  p_clerk_user_id text
)
returns boolean
language sql
stable
as $$
  select
    p_identity_id is not distinct from public.access_current_identity_id()
    and p_clerk_user_id is not distinct from public.access_current_clerk_user_id()
    or (
      p_identity_id is not distinct from public.access_jwt_identity_id()
      and p_clerk_user_id is not distinct from nullif(auth.jwt() ->> 'sub', '')
    );
$$;

-- Replace tenant policies with JWT + session context (service_role still bypasses — use tenant client for sync)
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
    pol := t || '_tenant_isolation';
    execute format('drop policy if exists %I on public.%I', pol, t);
    execute format(
      'create policy %I on public.%I for all using (
        public.access_tenant_allowed(identity_id, clerk_user_id)
      ) with check (
        public.access_tenant_allowed(identity_id, clerk_user_id)
      )',
      pol, t
    );
  end loop;
end $$;

-- Registry summary: count by identity_id with clerk_user_id fallback
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
    'systems', (select count(*) from public.systems s where (s.identity_id = p_identity_id or (s.identity_id is null and s.clerk_user_id = v_clerk)) and s.status = 'active'),
    'agents', (select count(*) from public.agents a where (a.identity_id = p_identity_id or (a.identity_id is null and a.clerk_user_id = v_clerk)) and a.status = 'active'),
    'projects', (select count(*) from public.builder_projects p where (p.identity_id = p_identity_id or (p.identity_id is null and p.clerk_user_id = v_clerk)) and p.status <> 'archived'),
    'blueprints', (select count(*) from public.blueprints b where b.identity_id = p_identity_id or (b.identity_id is null and b.clerk_user_id = v_clerk)),
    'assets', (select count(*) from public.assets ast where (ast.identity_id = p_identity_id or (ast.identity_id is null and ast.clerk_user_id = v_clerk)) and ast.status = 'active'),
    'workflows', (select count(*) from public.workflows w where (w.identity_id = p_identity_id or (w.identity_id is null and w.clerk_user_id = v_clerk)) and w.status = 'active'),
    'vaults', (select count(*) from public.vaults v where (v.identity_id = p_identity_id or (v.identity_id is null and v.clerk_user_id = v_clerk)) and v.status = 'active'),
    'connections', v_connections,
    'offers', (select count(*) from public.offers o where (o.identity_id = p_identity_id or (o.identity_id is null and o.clerk_user_id = v_clerk)) and o.status <> 'archived')
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

-- Allow authenticated role to access tenant tables (RLS still applies)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.vault_connections to authenticated;
grant select, insert, update, delete on public.connector_devices to authenticated;
grant select, insert, update, delete on public.sync_runs to authenticated;
grant select, insert, update, delete on public.sync_jobs to authenticated;
grant select, insert, update, delete on public.sync_audit_events to authenticated;
grant select, insert, update, delete on public.systems to authenticated;
grant select, insert, update, delete on public.agents to authenticated;
grant select, insert, update, delete on public.builder_projects to authenticated;
grant select, insert, update, delete on public.blueprints to authenticated;
grant select, insert, update, delete on public.assets to authenticated;
grant select, insert, update, delete on public.workflows to authenticated;
grant select, insert, update, delete on public.vaults to authenticated;
grant select, insert, update, delete on public.offers to authenticated;
grant execute on function public.access_jwt_identity_id() to authenticated;
grant execute on function public.access_tenant_allowed(uuid, text) to authenticated;
grant execute on function public.get_registry_summary(uuid) to authenticated;
