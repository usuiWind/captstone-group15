# What Comes Next

Priority order. Completed items are marked.

---

## P0 — Build errors DONE

- Zod v4 `invalid_type_error` / `errorMap` / `.errors` incompatibilities — fixed in `lib/validation.ts`
- Stripe API version mismatch — updated to `2026-02-25.clover`, period dates read from `subscription.items.data[0]`
- Admin panel membership data — `findAll()` added to `IMembershipRepository`
- Dead `/member-register-form` route — aliased to `RegisterPage` in `App.jsx`
- Duplicate `transform` key in `Navbar.jsx` — removed

---

## P1 — Email and Supabase setup (required before demo)

**Resend**
1. Create account at resend.com, verify sending domain.
2. Add `RESEND_API_KEY` and `FROM_EMAIL` to `.env.local`.
3. Trigger `checkout.session.completed` via Stripe CLI to test the welcome email.

**Supabase**
1. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
2. Run `backend/supabase/additional_tables.sql` in the Supabase SQL editor.
3. Container auto-switches to Supabase repositories when `SUPABASE_URL` is present.

---

## P2 — Rate limiter migration DONE

`lib/rateLimit.ts` has been rewritten to use `@upstash/ratelimit` with a sliding-window algorithm backed by Upstash Redis. The implementation falls back to an ephemeral in-process `Map` when `UPSTASH_REDIS_REST_URL` is not set (dev/test — no account needed).

**To activate in production:**
1. Create a free Redis database at [console.upstash.com](https://console.upstash.com).
2. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel environment variables.

All call sites now use `authRateLimitAsync` / `generalRateLimitAsync` (async). The old synchronous `createRateLimit` export is replaced by `createRateLimitAsync` (used in tests).

---

## P3 — Stripe webhook idempotency DONE

`app/api/webhooks/stripe/route.ts` now deduplicates on Stripe's event ID:

1. **Pre-check:** after signature validation, look up `event.id` in the new `processed_stripe_events` table. If found, return 200 immediately — no business logic runs.
2. **Post-write:** after the `switch` block succeeds, upsert `event.id` into the table (`ON CONFLICT DO NOTHING`) so concurrent races are safe.
3. **DB-level safety net:** `UNIQUE` partial indexes on `memberships(stripe_payment_id)` and `memberships(stripe_customer_id)` prevent duplicate rows even if the check-then-act sequence somehow races.

Both guards are skipped when `SUPABASE_URL` is not set (local dev — no real Stripe present).

**Required:** run the updated `backend/supabase/additional_tables.sql` in the Supabase SQL editor to create the `processed_stripe_events` table and the two new indexes.

---

## P4 — Contact form email

Add `sendContactNotification(name, email, message)` to `lib/email.ts` and call it in `app/api/contact/route.ts`.

---

## P5 — CSP nonce (post-launch hardening)

Replace `unsafe-inline` in `Content-Security-Policy` with a per-request nonce.
1. Migrate inline styles in `AdminPage.jsx`, `DashboardPage.jsx` to CSS modules.
2. Generate nonce in `lib/security.ts`, pass to Next.js `<Script>` tags.
3. Remove `unsafe-inline`, add `'nonce-<value>'` to CSP.

---

## Completed Features

- **Stripe webhook idempotency** — `processed_stripe_events` table deduplicates on Stripe event ID; `UNIQUE` indexes on `stripe_payment_id` / `stripe_customer_id` as a DB-level safety net.
- **Admin email OTP (MFA)** — Two-step login for admin accounts. Password → 6-digit code emailed via Resend → JWT issued. Code is bcrypt-hashed before storage, expires in 10 min, single-use. Member accounts are unaffected.
- **Redis rate limiting** — Replaced in-memory store with Upstash Redis sliding-window limiter. Works correctly across Vercel serverless invocations. Ephemeral fallback for local dev.
- Admin member PATCH (role, name, revoke) and DELETE (Stripe cancel + user delete)
- Attendance PATCH and DELETE with point_transactions cascade
- Events system: `events` table, full repository (stub + Supabase), admin CRUD API, public GET
- Admin Events tab in frontend with calendar list and create/edit form
- Google / Microsoft Forms attendance webhook (`POST /api/webhooks/forms`)
- Staff and sponsor Supabase repositories (no longer in-memory only)
- Stale JWT role vulnerability fixed — live DB read in session callback
- Security headers on all responses
- CORS restricted to `FRONTEND_ORIGIN`
- All inputs validated with Zod before any DB call
