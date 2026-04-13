-- Run this in the Supabase SQL Editor.
-- Tables are safe to run multiple times (CREATE TABLE IF NOT EXISTS).

-- ─── Verification tokens (invite links sent after Stripe payment) ──────────────
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  token       TEXT        PRIMARY KEY,
  identifier  TEXT        NOT NULL,
  expires     TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Events (meetings, workshops, etc.) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id           SERIAL      PRIMARY KEY,
  title        TEXT        NOT NULL,
  description  TEXT,
  event_date   DATE        NOT NULL,
  points_value INTEGER     NOT NULL DEFAULT 1,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance (check-ins per user per event) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id             SERIAL      PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id       INTEGER     REFERENCES public.events(id) ON DELETE SET NULL,
  check_in_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Point transactions (authoritative point ledger) ──────────────────────────
-- attendance_id links back to the attendance row so CASCADE deletes clean up points
-- automatically when an attendance record is removed.
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id             SERIAL      PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id       INTEGER     REFERENCES public.events(id) ON DELETE SET NULL,
  attendance_id  INTEGER     REFERENCES public.attendance(id) ON DELETE CASCADE,
  points         INTEGER     NOT NULL,
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Staff members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL,
  bio        TEXT,
  email      TEXT,
  image_url  TEXT,
  "order"    INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Sponsors ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsors (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  logo_url    TEXT    NOT NULL DEFAULT '',
  website_url TEXT,
  tier        TEXT    NOT NULL CHECK (tier IN ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE')),
  "order"     INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Unmatched form submissions (Google/Microsoft Forms webhook fallback) ──────
-- Rows land here when a form submission email doesn't match any registered user.
-- Admins review and reconcile manually.
CREATE TABLE IF NOT EXISTS public.unmatched_form_submissions (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT    NOT NULL,
  raw_payload JSONB   NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved    BOOLEAN NOT NULL DEFAULT FALSE
);
