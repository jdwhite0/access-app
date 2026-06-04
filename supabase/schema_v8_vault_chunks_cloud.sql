-- ACCESS schema_v8 — Cloud vault content chunks (JYSON memory on Vercel)
-- Apply after schema_v5_vault_files.sql in Supabase SQL Editor.
-- Safe to re-run: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- Does not alter vault_files (metadata-only store).

create table if not exists public.vault_chunks (
  id              uuid primary key default gen_random_uuid(),
  vault_id        uuid not null references public.vaults(id) on delete cascade,
  clerk_user_id   text not null,
  source_path     text not null,
  chunk_index     integer not null default 0,
  content         text not null,
  token_estimate  integer,
  content_hash    text,
  indexed_at      timestamptz not null default now(),
  constraint vault_chunks_vault_path_chunk unique (vault_id, source_path, chunk_index)
);

create index if not exists idx_vault_chunks_vault_id
  on public.vault_chunks (vault_id);

create index if not exists idx_vault_chunks_clerk_vault
  on public.vault_chunks (clerk_user_id, vault_id);

create index if not exists idx_vault_chunks_indexed_at
  on public.vault_chunks (vault_id, indexed_at desc);

-- Tenant isolation: chunk clerk_user_id must match parent vault row
alter table public.vault_chunks enable row level security;

drop policy if exists vault_chunks_tenant_isolation on public.vault_chunks;

create policy vault_chunks_tenant_isolation on public.vault_chunks
  for all
  using (
    clerk_user_id is not distinct from public.access_current_clerk_user_id()
    or clerk_user_id is not distinct from nullif(auth.jwt() ->> 'sub', '')
  )
  with check (
    exists (
      select 1
      from public.vaults v
      where v.id = vault_chunks.vault_id
        and v.clerk_user_id = vault_chunks.clerk_user_id
        and (
          v.clerk_user_id is not distinct from public.access_current_clerk_user_id()
          or v.clerk_user_id is not distinct from nullif(auth.jwt() ->> 'sub', '')
        )
    )
  );

comment on table public.vault_chunks is
  'Searchable vault note chunks for cloud JYSON retrieval; replaced on each vault sync.';
