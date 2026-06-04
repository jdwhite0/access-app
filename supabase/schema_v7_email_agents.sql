-- ACCESS v7 — Email send queue + delivery logs (email agent architecture)
-- Apply in Supabase SQL editor after schema_v6_email_preferences.sql (see APPLY_ORDER.md)
-- user_id references access_identities (consistent with v6 email_preferences)

-- ────────────────────────────────────────────────────────────
-- email_send_queue
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_send_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NULL REFERENCES public.access_identities(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,
  email_type          TEXT NOT NULL,
  category            TEXT NOT NULL,
  subject             TEXT,
  preview_text        TEXT,
  html_body           TEXT,
  text_body           TEXT,
  scheduled_for       TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped', 'blocked')),
  provider_message_id TEXT,
  blocked_reason      TEXT,
  idempotency_key     TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_queue_status_scheduled
  ON public.email_send_queue (status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_email_send_queue_user
  ON public.email_send_queue (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_queue_idempotency
  ON public.email_send_queue (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- email_delivery_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_queue_id       UUID NULL REFERENCES public.email_send_queue(id) ON DELETE CASCADE,
  user_id             UUID NULL REFERENCES public.access_identities(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,
  email_type          TEXT,
  category            TEXT,
  status              TEXT NOT NULL
    CHECK (status IN (
      'queued', 'sent', 'failed', 'skipped', 'blocked',
      'unsubscribed', 'bounced', 'complained'
    )),
  provider_message_id TEXT,
  error_message       TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_queue
  ON public.email_delivery_logs (send_queue_id);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_email
  ON public.email_delivery_logs (email, created_at DESC);

-- updated_at trigger for send queue
CREATE OR REPLACE FUNCTION public.set_email_send_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_send_queue_updated_at ON public.email_send_queue;
CREATE TRIGGER trg_email_send_queue_updated_at
  BEFORE UPDATE ON public.email_send_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_email_send_queue_updated_at();

ALTER TABLE public.email_send_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;
