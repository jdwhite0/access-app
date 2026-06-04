-- user_ai_profiles — personalized JYSON identity per user
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_ai_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id         text UNIQUE NOT NULL,
  identity_id           uuid REFERENCES access_identities(id) ON DELETE SET NULL,
  ai_name               text NOT NULL DEFAULT 'JYSON',
  ai_role               text NOT NULL DEFAULT 'AI operator',
  ai_tone               text NOT NULL DEFAULT 'strategic, clear, direct',
  ai_purpose            text NOT NULL DEFAULT 'help you turn ideas, assets, knowledge, and work into systems that compound',
  onboarding_completed  boolean NOT NULL DEFAULT false,
  onboarding_answers    jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can only read/write their own profile
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_profiles_self_read"  ON user_ai_profiles FOR SELECT USING (clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub'));
CREATE POLICY "user_ai_profiles_self_write" ON user_ai_profiles FOR ALL    USING (clerk_user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub'));

-- Service role bypasses RLS for admin operations
-- Index for fast lookup
CREATE INDEX IF NOT EXISTS user_ai_profiles_clerk_idx ON user_ai_profiles (clerk_user_id);
