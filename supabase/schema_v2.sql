-- ACCESS Registry — Schema v2
-- Run this in the Supabase SQL editor AFTER schema.sql
-- These are additive — no existing tables are modified

-- ────────────────────────────────────────────────────────────
-- builder_projects
-- Structured build plans generated from JYSON handoffs.
-- ────────────────────────────────────────────────────────────
create table if not exists public.builder_projects (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  system_id       uuid references public.systems(id) on delete set null,
  name            text not null,
  objective       text,
  status          text default 'active' not null,  -- active | completed | archived
  milestones      jsonb default '[]'::jsonb,
  tasks           jsonb default '[]'::jsonb,
  stack           jsonb default '[]'::jsonb,
  assets          jsonb default '[]'::jsonb,
  architecture    text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- agents
-- Autonomous AI entities with specific roles and capabilities.
-- An agent acts. A system operates.
-- ────────────────────────────────────────────────────────────
create table if not exists public.agents (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  name            text not null,
  description     text,
  role            text,
  system_id       uuid references public.systems(id) on delete set null,
  status          text default 'active' not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- assets
-- Intellectual property: code, content, creative works,
-- datasets, brand elements, documents, media.
-- ────────────────────────────────────────────────────────────
create table if not exists public.assets (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  name            text not null,
  description     text,
  asset_type      text not null,  -- code | content | creative | data | document | brand | other
  url             text,
  status          text default 'active' not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- workflows
-- Repeatable operational sequences — automation chains,
-- processes, playbooks. Trigger → Logic → Action → Output.
-- ────────────────────────────────────────────────────────────
create table if not exists public.workflows (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  name            text not null,
  description     text,
  trigger         text,
  system_id       uuid references public.systems(id) on delete set null,
  status          text default 'active' not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- vaults
-- Knowledge repositories — memory, context, expertise,
-- research, decisions. The intelligence layer over time.
-- ────────────────────────────────────────────────────────────
create table if not exists public.vaults (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  name            text not null,
  description     text,
  vault_type      text,  -- obsidian | notion | drive | local | other
  status          text default 'active' not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- offers
-- Products, services, value propositions.
-- Where ownership meets the market.
-- ────────────────────────────────────────────────────────────
create table if not exists public.offers (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  name            text not null,
  description     text,
  delivery        text,
  pricing         text,
  status          text default 'draft' not null,  -- draft | active | paused | archived
  system_id       uuid references public.systems(id) on delete set null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────
create index if not exists idx_builder_projects_clerk on public.builder_projects(clerk_user_id);
create index if not exists idx_agents_clerk           on public.agents(clerk_user_id);
create index if not exists idx_assets_clerk           on public.assets(clerk_user_id);
create index if not exists idx_workflows_clerk        on public.workflows(clerk_user_id);
create index if not exists idx_vaults_clerk           on public.vaults(clerk_user_id);
create index if not exists idx_offers_clerk           on public.offers(clerk_user_id);
