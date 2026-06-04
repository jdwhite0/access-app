-- ACCESS v6 — Email preferences, consent log, unsubscribe events
-- Apply in Supabase SQL editor after schema_v5_vault_files.sql (see APPLY_ORDER.md)

-- Marketing / intelligence email preferences (one row per ACCESS identity)
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.access_identities(id) ON DELETE CASCADE,
  daily_brief_enabled       BOOLEAN NOT NULL DEFAULT true,
  weekly_digest_enabled     BOOLEAN NOT NULL DEFAULT true,
  product_updates_enabled   BOOLEAN NOT NULL DEFAULT true,
  founder_notes_enabled     BOOLEAN NOT NULL DEFAULT true,
  educational_content_enabled BOOLEAN NOT NULL DEFAULT true,
  partner_offers_enabled    BOOLEAN NOT NULL DEFAULT false,
  marketing_paused          BOOLEAN NOT NULL DEFAULT false,
  frequency                 TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'major_updates_only', 'paused')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON public.email_preferences (user_id);

-- Consent audit trail (signup, settings changes, unsubscribe reversals)
CREATE TABLE IF NOT EXISTS public.email_consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NULL REFERENCES public.access_identities(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  consent_type    TEXT NOT NULL,
  consent_status  TEXT NOT NULL CHECK (consent_status IN ('granted', 'denied', 'withdrawn')),
  source          TEXT NOT NULL,
  ip_address      TEXT NULL,
  user_agent      TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_consent_log_user ON public.email_consent_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_consent_log_email ON public.email_consent_log (email, created_at DESC);

-- Public unsubscribe events (token flow; user_id optional for non-account emails)
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NULL REFERENCES public.access_identities(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,
  category            TEXT NOT NULL,
  unsubscribe_token   TEXT NOT NULL,
  source              TEXT NOT NULL,
  ip_address          TEXT NULL,
  user_agent          TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_email ON public.email_unsubscribe_events (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_token ON public.email_unsubscribe_events (unsubscribe_token);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER trg_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_email_preferences_updated_at();

-- RLS: app uses service role; no direct client access
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_events ENABLE ROW LEVEL SECURITY;
