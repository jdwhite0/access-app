-- ACCESS v9 — Revenue Agent System: Pipeline CRM + Quota + Activity Logs
-- Apply after schema_v8_vault_chunks_cloud.sql (see APPLY_ORDER.md)
-- This is the shared brain for all 7 autonomous revenue agents.

-- ─────────────────────────────────────────────────────────────────
-- VENTURE ICPs (hardwired ideal client profiles per arm)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.venture_icps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arm             TEXT NOT NULL UNIQUE, -- 'consulting', 'bridge-video', 'access'
  display_name    TEXT NOT NULL,
  offer_summary   TEXT NOT NULL,
  icp_definition  JSONB NOT NULL DEFAULT '{}'::jsonb,
  deal_min        NUMERIC,
  deal_max        NUMERIC,
  sales_cycle_days INTEGER,
  outreach_quota_daily INTEGER NOT NULL DEFAULT 10,
  scout_quota_daily    INTEGER NOT NULL DEFAULT 15,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed ICPs immediately — agents read this at runtime, not hardcoded
INSERT INTO public.venture_icps (arm, display_name, offer_summary, icp_definition, deal_min, deal_max, sales_cycle_days, outreach_quota_daily, scout_quota_daily)
VALUES
  (
    'consulting',
    'Kingdom Consulting',
    'Creative Operating System: visual identity, brand narrative, content pillars, rollout calendar, self-governance model. $10K–$25K per engagement. Not a service — a transfer of power.',
    '{
      "targets": ["independent recording artists", "podcasters with growing audiences", "small creative agencies (1-10 people)", "faith organizations with media teams", "creative entrepreneurs"],
      "revenue_range": "$50K–$500K/year",
      "size": "1–20 person operations",
      "pain_points": ["inconsistent brand/content output", "creative talent without structural system", "dependency on others for direction", "no rollout calendar or identity framework"],
      "geography": "Tampa Bay FL priority, nationwide US",
      "positive_signals": ["active social presence but scattered", "posting inconsistently", "launching products with no cohesive story", "searching for creative partner not vendor"],
      "disqualifiers": ["Fortune 500 with marketing departments", "people who only want execution", "purely hobbyist freelancers", "finance / law / insurance industries"],
      "scoring": {
        "social_presence_real_engagement": 2,
        "running_actual_business": 2,
        "evidence_of_creative_struggle": 2,
        "publicly_expressed_need_for_strategy": 2,
        "contactable_email_visible": 1,
        "tampa_bay_location": 1
      },
      "min_score": 7,
      "cta": "20-minute conversation via https://calendly.com/jdwhite",
      "voice": "human, direct, specific — not salesy. Reference something specific about their work. Diagnose before pitching."
    }'::jsonb,
    10000, 25000, 45, 10, 15
  ),
  (
    'bridge-video',
    'Bridge Video',
    'Commercial video production: ads, brand films, product videos. We make commercials the kind people remember. $2K–$8K per project, $3K–$5K/month retainer.',
    '{
      "targets": ["local/regional businesses in Tampa Bay FL", "national mid-size brands with ad budgets", "restaurants, retail, real estate, healthcare, fitness, hospitality"],
      "revenue_range": "$500K–$10M annual business revenue",
      "pain_points": ["running static image ads with no video", "low social engagement", "new product/service launch with no visual story", "generic or zero video marketing presence"],
      "positive_signals": ["running Facebook or Google ads", "new location opening", "recent rebrand or product launch", "low video engagement despite solid follower count"],
      "disqualifiers": ["Fortune 500 with agency retainers", "pure e-commerce with no local presence"],
      "geography": "Tampa Bay FL primary, national secondary",
      "existing_clients": ["REF", "Hampton Chocolate Factory", "DERRICK", "Richie"],
      "scoring": {
        "active_ad_spend_but_no_video": 3,
        "recent_launch_or_rebrand": 2,
        "local_or_mid_size_business": 2,
        "contactable_email_or_decision_maker": 2,
        "tampa_bay_location": 1
      },
      "min_score": 7,
      "cta": "15-minute call to see if we''re a fit: https://calendly.com/jdwhite",
      "voice": "confident, proof-driven. Reference the specific gap (no video despite ad spend). Bridge the gap with a clear outcome."
    }'::jsonb,
    2000, 8000, 14, 8, 10
  ),
  (
    'access',
    'ACCESS Platform',
    'AI operating system for builders and creative entrepreneurs. Personal $29/mo, Builder $99/mo, Enterprise $299/mo. 14-day free trial on Builder.',
    '{
      "targets": ["indie makers", "startup founders", "small agency owners", "creative entrepreneurs building systems", "solopreneurs managing multiple projects"],
      "pain_points": ["no central OS for their business", "scattered tools with no intelligence layer", "building in isolation with no command center"],
      "content_themes": ["AI operating systems", "builder workflows", "creative entrepreneurship", "systems that scale without more staff"],
      "platforms": ["LinkedIn", "Twitter/X", "short-form video"],
      "cta": "14-day free Builder trial at https://app-iota-inky-62.vercel.app/plans",
      "daily_content_quota": 3
    }'::jsonb,
    29, 299, 1, 0, 0
  )
ON CONFLICT (arm) DO UPDATE SET
  offer_summary    = EXCLUDED.offer_summary,
  icp_definition   = EXCLUDED.icp_definition,
  deal_min         = EXCLUDED.deal_min,
  deal_max         = EXCLUDED.deal_max,
  sales_cycle_days = EXCLUDED.sales_cycle_days,
  updated_at       = now();

-- ─────────────────────────────────────────────────────────────────
-- PIPELINE LEADS (the CRM)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arm                 TEXT NOT NULL REFERENCES public.venture_icps(arm) ON DELETE RESTRICT,
  stage               TEXT NOT NULL DEFAULT 'IDENTIFIED'
    CHECK (stage IN (
      'IDENTIFIED', 'SCORED', 'QUEUED', 'OUTREACH_SENT',
      'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3',
      'REPLIED', 'CALL_BOOKED', 'PROPOSED',
      'CLOSED_WON', 'CLOSED_LOST', 'NURTURE_30'
    )),
  first_name          TEXT,
  last_name           TEXT,
  email               TEXT NOT NULL,
  company             TEXT,
  title               TEXT,
  website             TEXT,
  linkedin_url        TEXT,
  instagram_url       TEXT,
  industry            TEXT,
  location            TEXT,
  icp_score           INTEGER CHECK (icp_score BETWEEN 1 AND 10),
  icp_notes           TEXT,
  source_agent        TEXT NOT NULL DEFAULT 'MANUAL',
  source_url          TEXT,
  outreach_count      INTEGER NOT NULL DEFAULT 0,
  last_outreach_at    TIMESTAMPTZ,
  next_action_at      TIMESTAMPTZ,
  next_action         TEXT,
  reply_received_at   TIMESTAMPTZ,
  call_booked_at      TIMESTAMPTZ,
  call_notes          TEXT,
  proposal_sent_at    TIMESTAMPTZ,
  proposal_amount     NUMERIC,
  closed_at           TIMESTAMPTZ,
  closed_value        NUMERIC,
  loss_reason         TEXT,
  nurture_until       TIMESTAMPTZ,
  flagged_for_jerry   BOOLEAN NOT NULL DEFAULT false,
  flag_reason         TEXT,
  tags                TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes               TEXT,
  raw_data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same email can't be in the same arm twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_leads_email_arm
  ON public.pipeline_leads (lower(email), arm);

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_arm_stage
  ON public.pipeline_leads (arm, stage);

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_next_action
  ON public.pipeline_leads (next_action_at)
  WHERE stage IN ('OUTREACH_SENT', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3');

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_flagged
  ON public.pipeline_leads (flagged_for_jerry)
  WHERE flagged_for_jerry = true;

-- ─────────────────────────────────────────────────────────────────
-- PIPELINE STAGE HISTORY (full audit trail)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.pipeline_leads(id) ON DELETE CASCADE,
  from_stage  TEXT,
  to_stage    TEXT NOT NULL,
  changed_by  TEXT NOT NULL, -- agent code or 'JERRY'
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_lead
  ON public.pipeline_stage_history (lead_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- AGENT DAILY QUOTAS (agents read this to know their target)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_daily_quotas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code  TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  target      INTEGER NOT NULL,
  completed   INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ON_TRACK', 'BEHIND', 'COMPLETE', 'SKIPPED')),
  last_run_at TIMESTAMPTZ,
  run_count   INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_code, date)
);

-- Seed today's quotas for all agents
INSERT INTO public.agent_daily_quotas (agent_code, date, target)
VALUES
  ('SCOUT-CON',   CURRENT_DATE, 15),
  ('SCOUT-BV',    CURRENT_DATE, 10),
  ('REACH-CON',   CURRENT_DATE, 10),
  ('REACH-BV',    CURRENT_DATE, 8),
  ('PUB-ACCESS',  CURRENT_DATE, 3),
  ('PIPE-MGR',    CURRENT_DATE, 999),
  ('REPORT-2X',   CURRENT_DATE, 2)
ON CONFLICT (agent_code, date) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- AGENT ACTIVITY LOGS (what each agent actually did)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code  TEXT NOT NULL,
  action      TEXT NOT NULL,
  lead_id     UUID REFERENCES public.pipeline_leads(id) ON DELETE SET NULL,
  arm         TEXT,
  success     BOOLEAN NOT NULL DEFAULT true,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_agent_date
  ON public.agent_activity_logs (agent_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_lead
  ON public.agent_activity_logs (lead_id)
  WHERE lead_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- OUTREACH HISTORY (deduplication — never contact twice in 30 days)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  arm                 TEXT NOT NULL,
  lead_id             UUID REFERENCES public.pipeline_leads(id) ON DELETE SET NULL,
  message_type        TEXT NOT NULL
    CHECK (message_type IN ('OUTREACH_1', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3')),
  subject             TEXT,
  body_preview        TEXT,
  provider_message_id TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent sending the same message type twice to the same email in the same arm
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_history_dedup
  ON public.outreach_history (lower(email), arm, message_type);

CREATE INDEX IF NOT EXISTS idx_outreach_history_email_arm
  ON public.outreach_history (lower(email), arm, sent_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- AGENT REPORTS (stored twice-daily reports)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type   TEXT NOT NULL CHECK (report_type IN ('MORNING', 'EVENING', 'WEEKLY', 'MONTHLY')),
  report_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  payload       JSONB NOT NULL,
  slack_ts      TEXT,
  delivered_to  TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_reports_date
  ON public.agent_reports (report_date DESC, report_type);

-- ─────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_venture_icps_updated_at
    BEFORE UPDATE ON public.venture_icps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_pipeline_leads_updated_at
    BEFORE UPDATE ON public.pipeline_leads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_agent_daily_quotas_updated_at
    BEFORE UPDATE ON public.agent_daily_quotas
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (service role bypasses all — only server touches this)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.venture_icps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_daily_quotas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reports        ENABLE ROW LEVEL SECURITY;

-- Service role full access (agents use service role key)
CREATE POLICY "service_role_all_venture_icps"       ON public.venture_icps         FOR ALL USING (true);
CREATE POLICY "service_role_all_pipeline_leads"     ON public.pipeline_leads        FOR ALL USING (true);
CREATE POLICY "service_role_all_stage_history"      ON public.pipeline_stage_history FOR ALL USING (true);
CREATE POLICY "service_role_all_quotas"             ON public.agent_daily_quotas    FOR ALL USING (true);
CREATE POLICY "service_role_all_activity_logs"      ON public.agent_activity_logs   FOR ALL USING (true);
CREATE POLICY "service_role_all_outreach_history"   ON public.outreach_history      FOR ALL USING (true);
CREATE POLICY "service_role_all_agent_reports"      ON public.agent_reports         FOR ALL USING (true);
