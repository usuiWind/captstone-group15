-- Run this in the Supabase SQL Editor.

-- ─── Verification tokens (invite links sent after Stripe payment) ──────────────
CREATE TABLE public.verification_tokens (
  token       TEXT        PRIMARY KEY,
  identifier  TEXT        NOT NULL,   -- the user's email
  expires     TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
