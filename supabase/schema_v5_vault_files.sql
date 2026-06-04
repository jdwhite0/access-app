-- ACCESS schema_v5 — Per-file vault metadata (platform sync, no file bodies)
-- Apply after schema_v5_vaults_extended.sql in Supabase SQL Editor.
-- Safe to re-run: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

create table if not exists public.vault_files (
  id              uuid primary key default gen_random_uuid(),
  vault_id        uuid not null references public.vaults(id) on delete cascade,
  clerk_user_id   text not null,
  relative_path   text not null,
  extension       text,
  size_bytes      bigint not null default 0,
  modified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint vault_files_vault_path unique (vault_id, relative_path)
);

create index if not exists idx_vault_files_vault on public.vault_files(vault_id);
create index if not exists idx_vault_files_clerk on public.vault_files(clerk_user_id);

-- Optional: allow registry vault sync statuses (pending_sync → connected)
alter table public.vaults drop constraint if exists vaults_status_check;
alter table public.vaults add constraint vaults_status_check check (
  status in ('active', 'inactive', 'archived', 'pending_sync', 'connected')
);
