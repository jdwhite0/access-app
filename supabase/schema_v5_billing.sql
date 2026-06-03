-- ACCESS v5 — Billing & Plan tier
-- Apply in Supabase SQL editor after schema_v4_m2_tenant_jwt.sql

-- Add plan tier to access identities
ALTER TABLE access_identities
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('founder', 'free', 'operator', 'builder', 'enterprise')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS usage_credits INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Tag the founder account as permanently free
UPDATE access_identities
  SET plan = 'founder',
      notes = 'Founder account — lifetime access, no billing required'
  WHERE handle = 'jdwhite.access';

-- Index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_access_identities_plan ON access_identities (plan);

-- Usage tracking table for metered billing
CREATE TABLE IF NOT EXISTS usage_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID NOT NULL REFERENCES access_identities(id) ON DELETE CASCADE,
  clerk_user_id   TEXT NOT NULL,
  event_type      TEXT NOT NULL, -- 'jyson_message', 'tool_execute', 'registry_write', etc.
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_identity ON usage_events (identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_clerk    ON usage_events (clerk_user_id, created_at DESC);

-- RLS on usage_events
-- Access is enforced at the application layer via service role key + clerk_user_id filter.
-- RLS is enabled but only the service role (used by Next.js server actions) can write rows.
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — app reads usage per user via clerk_user_id in server actions.
-- No end-user direct read policy needed since the client never calls Supabase directly.

-- Plan limits reference table (not enforced in DB — enforced in application layer)
CREATE TABLE IF NOT EXISTS plan_limits (
  plan                TEXT PRIMARY KEY,
  jyson_messages_mo   INT NULL,   -- NULL = unlimited
  registry_objects    INT NULL,
  local_tools         BOOLEAN NOT NULL DEFAULT false,
  price_monthly_usd   INT NOT NULL DEFAULT 0
);

INSERT INTO plan_limits (plan, jyson_messages_mo, registry_objects, local_tools, price_monthly_usd) VALUES
  ('founder',    NULL, NULL, true,  0),
  ('free',       50,   5,    false, 0),
  ('operator',   NULL, 25,   false, 299),
  ('builder',    NULL, NULL, true,  599),
  ('enterprise', NULL, NULL, true,  2000)
ON CONFLICT (plan) DO NOTHING;
