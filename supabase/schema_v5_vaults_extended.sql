-- ACCESS schema_v5 — Vault extended fields
-- Adds local_path, last_synced_at, file_count to the vaults table.
-- Safe to run multiple times: uses ADD COLUMN IF NOT EXISTS.
-- Apply in Supabase SQL editor after schema_v3_vault.sql.

alter table public.vaults add column if not exists local_path text;
alter table public.vaults add column if not exists last_synced_at timestamptz;
alter table public.vaults add column if not exists file_count integer not null default 0;

-- Index for quick lookup by clerk_user_id + local_path (vault uniqueness per user)
create index if not exists idx_vaults_clerk_path
  on public.vaults (clerk_user_id, local_path)
  where local_path is not null;

-- Also expand vault_type check constraint to include google_drive and manual
-- (Supabase: drop old check, add new one — safe on empty constraint tables)
alter table public.vaults drop constraint if exists vaults_vault_type_check;
alter table public.vaults add constraint vaults_vault_type_check check (
  vault_type in ('obsidian', 'notion', 'drive', 'local', 'other', 'google_drive', 'manual')
);
