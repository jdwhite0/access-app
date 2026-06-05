-- Sales Concierge leads table — Department 01
-- Apply in Supabase SQL Editor. Safe to re-run.

create table if not exists public.sales_leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null,
  company         text,
  recommendation  text not null,
  answers         jsonb not null default '{}',
  status          text not null default 'new',
  created_at      timestamptz not null default now(),
  constraint sales_leads_recommendation_check check (recommendation in ('launch', 'grow', 'scale')),
  constraint sales_leads_status_check check (status in ('new', 'contacted', 'converted', 'closed'))
);

create index if not exists idx_sales_leads_email          on public.sales_leads (email);
create index if not exists idx_sales_leads_status         on public.sales_leads (status);
create index if not exists idx_sales_leads_recommendation on public.sales_leads (recommendation);
create index if not exists idx_sales_leads_created        on public.sales_leads (created_at desc);

alter table public.sales_leads enable row level security;

-- Service role only (lead capture is unauthenticated via API, no public RLS needed)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'sales_leads'
      and policyname = 'sales_leads_service_all'
  ) then
    execute $policy$
      create policy "sales_leads_service_all"
        on public.sales_leads for all
        using (true)
        with check (true)
    $policy$;
  end if;
end
$$;
