-- ACCESS schema_v6 — Customers table
-- Apply in Supabase SQL editor. Safe to re-run.

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  owner_handle  text not null,
  name          text not null,
  email         text,
  type          text not null default 'contact',
  notes         text,
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint customers_status_check check (status in ('active', 'inactive', 'archived')),
  constraint customers_type_check check (type in ('client', 'lead', 'subscriber', 'partner', 'contact'))
);

create index if not exists idx_customers_clerk on public.customers (clerk_user_id);
create index if not exists idx_customers_status on public.customers (clerk_user_id, status);

-- Row-level security
alter table public.customers enable row level security;

create policy if not exists "customers_owner_all"
  on public.customers for all
  using (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));
