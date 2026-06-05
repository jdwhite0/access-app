-- JDWhite.world subscriber system
-- Separate from ACCESS platform users (no user_id FK — anonymous subscribers)
-- Two tracks live here:
--   1. ECOSYSTEM / AUDIENCE  → jdw_subscribers (newsletter, dispatch, paths)
--   2. BUSINESS DEV          → sales_leads (already exists via schema_concierge.sql)
--
-- Apply after schema_concierge.sql. Safe to re-run.

-- ─── jdw_subscribers ──────────────────────────────────────────────────────────

create table if not exists public.jdw_subscribers (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null,
  name              text,

  -- WHERE they came from
  source            text        not null,
  -- 'newsletter' | 'ecosystem' | 'founder_dispatch' | 'product_updates' | 'field_notes'

  -- WHICH part of the ecosystem they're interested in
  selected_path     text,
  -- 'founder' | 'ecosystem' | 'product' | 'builder' | 'observer'

  interest_tags     text[]      not null default '{}',
  -- e.g. ['ai', 'strategy', 'systems', 'music', 'startups']

  -- LIFECYCLE
  subscriber_status text        not null default 'pending',
  -- 'pending' | 'confirmed' | 'unsubscribed' | 'bounced'

  automation_stage  integer     not null default 0,
  -- 0 = just subscribed
  -- 1 = welcome/confirmation sent
  -- 2+ = nurture sequence position

  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz,
  last_emailed_at   timestamptz,

  -- flexible metadata (IP, user agent, referrer, UTM params, etc.)
  metadata          jsonb       not null default '{}',

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- one subscriber per email per source track
  constraint jdw_subscribers_email_source_unique unique (email, source),

  constraint jdw_subscribers_status_check check (
    subscriber_status in ('pending', 'confirmed', 'unsubscribed', 'bounced')
  ),

  constraint jdw_subscribers_source_check check (
    source in ('newsletter', 'ecosystem', 'founder_dispatch', 'product_updates', 'field_notes')
  ),

  constraint jdw_subscribers_path_check check (
    selected_path is null or
    selected_path in ('founder', 'ecosystem', 'product', 'builder', 'observer')
  )
);

create index if not exists idx_jdw_subscribers_email
  on public.jdw_subscribers (email);

create index if not exists idx_jdw_subscribers_status
  on public.jdw_subscribers (subscriber_status);

create index if not exists idx_jdw_subscribers_source
  on public.jdw_subscribers (source);

create index if not exists idx_jdw_subscribers_stage
  on public.jdw_subscribers (automation_stage)
  where subscriber_status = 'confirmed';

create index if not exists idx_jdw_subscribers_created
  on public.jdw_subscribers (created_at desc);

alter table public.jdw_subscribers enable row level security;

-- Service role only — all writes via API, no public access
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'jdw_subscribers'
      and policyname = 'jdw_subscribers_service_all'
  ) then
    execute $policy$
      create policy "jdw_subscribers_service_all"
        on public.jdw_subscribers for all
        using (true)
        with check (true)
    $policy$;
  end if;
end
$$;

-- ─── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.set_jdw_subscribers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_jdw_subscribers_updated_at on public.jdw_subscribers;
create trigger trg_jdw_subscribers_updated_at
  before update on public.jdw_subscribers
  for each row execute function public.set_jdw_subscribers_updated_at();

-- ─── jdw_email_log ────────────────────────────────────────────────────────────
-- Tracks every email sent from jdwhite.world (both tracks)

create table if not exists public.jdw_email_log (
  id                  uuid        primary key default gen_random_uuid(),
  recipient_email     text        not null,
  email_type          text        not null,
  -- 'concierge_confirmation' | 'youre_on_my_radar' | 'discovery_scheduled'
  -- 'proposal_sent' | 'strategic_followup' | 'opportunity_closed'
  -- 'welcome_ecosystem' | 'choose_your_path' | 'registry_update' | 'world_activated'
  -- 'founder_dispatch' | 'field_notes' | 'current_thesis' | 'open_letter'
  -- 'product_update_access' | 'product_update_jyson' | 'product_update_vault'
  -- 'newsletter_build_what_comes_next' | 'newsletter_ecosystem_update'

  track               text        not null,
  -- 'business_dev' | 'ecosystem' | 'founder' | 'product' | 'newsletter'

  source_site         text        not null default 'jdwhite.world',
  venture             text        not null default 'jdwhite',

  lead_id             uuid        null references public.sales_leads(id) on delete set null,
  subscriber_id       uuid        null references public.jdw_subscribers(id) on delete set null,

  subject             text,
  resend_message_id   text,
  status              text        not null default 'sent',
  -- 'sent' | 'failed' | 'bounced' | 'opened' (future webhook)

  automation_stage    integer,
  metadata            jsonb       not null default '{}',
  sent_at             timestamptz not null default now()
);

create index if not exists idx_jdw_email_log_recipient
  on public.jdw_email_log (recipient_email, sent_at desc);

create index if not exists idx_jdw_email_log_type
  on public.jdw_email_log (email_type);

create index if not exists idx_jdw_email_log_track
  on public.jdw_email_log (track);

alter table public.jdw_email_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'jdw_email_log'
      and policyname = 'jdw_email_log_service_all'
  ) then
    execute $policy$
      create policy "jdw_email_log_service_all"
        on public.jdw_email_log for all
        using (true)
        with check (true)
    $policy$;
  end if;
end
$$;
