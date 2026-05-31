-- ACCESS — Supabase Schema
-- Run this in the Supabase SQL editor to create all tables
-- Dashboard: https://app.supabase.com → SQL Editor

-- ────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  access_handle   text,
  created_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- access_identities
-- One record per user. The handle is their permanent presence.
-- Authentication providers may change; this identity persists.
-- ────────────────────────────────────────────────────────────
create table if not exists public.access_identities (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  handle          text unique not null,  -- e.g., "jdwhite.access"
  status          text default 'active' not null,
  created_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- systems
-- Every registered system is a distinct digital entity.
-- It has its own identity, separate from its owner.
-- Registration creates the entity. Activation makes it operational.
-- ────────────────────────────────────────────────────────────
create table if not exists public.systems (
  id                  uuid primary key default gen_random_uuid(),
  clerk_user_id       text not null,
  owner_handle        text not null,              -- e.g., "jdwhite.access"
  system_handle       text unique not null,       -- e.g., "jdproductions.access"
  name                text not null,              -- e.g., "JD Productions OS"
  type                text not null,              -- ai | business | content | knowledge
  description         text,
  status              text default 'active' not null,
  activation_status   text default 'registered' not null,  -- registered | activating | active
  capabilities        jsonb default '[]'::jsonb,           -- array of capability strings
  connections         jsonb default '[]'::jsonb,           -- array of connected system handles
  blueprint_id        uuid,
  created_at          timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- Migration: run this if the table already exists
-- alter table public.systems
--   add column if not exists activation_status text default 'registered' not null,
--   add column if not exists capabilities jsonb default '[]'::jsonb,
--   add column if not exists connections jsonb default '[]'::jsonb;
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- blueprints
-- Generated blueprints — can be standalone or linked to a system.
-- ────────────────────────────────────────────────────────────
create table if not exists public.blueprints (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  type            text not null,          -- ai | business | content | knowledge
  answers         jsonb not null,
  system_id       uuid references public.systems(id) on delete set null,
  created_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- system_files
-- Future: attached documents, exports, assets per system.
-- ────────────────────────────────────────────────────────────
create table if not exists public.system_files (
  id              uuid primary key default gen_random_uuid(),
  system_id       uuid references public.systems(id) on delete cascade,
  clerk_user_id   text not null,
  filename        text,
  file_type       text,
  url             text,
  created_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- access_keys_preview
-- Reserved for future networking layer. Prototype preparation only.
-- Not active routing or communication — identity reservation only.
-- ────────────────────────────────────────────────────────────
create table if not exists public.access_keys_preview (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text not null,
  owner_handle    text not null,
  key_string      text unique not null,   -- system identity to be network-registered
  status          text default 'reserved' not null,
  created_at      timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
-- Indexes for common query patterns
-- ────────────────────────────────────────────────────────────
create index if not exists idx_systems_clerk_user on public.systems(clerk_user_id);
create index if not exists idx_blueprints_clerk_user on public.blueprints(clerk_user_id);
create index if not exists idx_system_files_system on public.system_files(system_id);
create index if not exists idx_access_keys_clerk_user on public.access_keys_preview(clerk_user_id);

-- ────────────────────────────────────────────────────────────
-- Row-Level Security (enable after verifying everything works)
-- ────────────────────────────────────────────────────────────
-- alter table public.profiles enable row level security;
-- alter table public.access_identities enable row level security;
-- alter table public.systems enable row level security;
-- alter table public.blueprints enable row level security;
-- alter table public.system_files enable row level security;
-- alter table public.access_keys_preview enable row level security;
