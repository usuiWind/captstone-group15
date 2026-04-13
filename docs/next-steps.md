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

## P2 — Rate limiter migration (required before public launch)

Replace `lib/rateLimit.ts` in-memory store with Upstash Redis. The current implementation provides no protection on Vercel serverless.

1. `npm install @upstash/ratelimit @upstash/redis` in backend.
2. Create Redis database at upstash.com.
3. Rewrite `lib/rateLimit.ts` to use `@upstash/ratelimit`. Exported signatures stay the same (`authRateLimit`, `generalRateLimit`, `adminRateLimit`, `getClientIdentifier`).
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

See `docs/deployment.md` for full steps.

---

## P3 — Stripe webhook idempotency

Guard against duplicate `checkout.session.completed` events in `app/api/webhooks/stripe/route.ts`:
- Check `repositories.user.findByEmail` before creating a user
- Check `findByStripeCustomerId` before creating a membership
- Estimated: 20 min

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

## P6 — MFA (optional, post-launch)

See `docs/mfa-and-forms-plan.md` for two implementation options:
- Option A: Email OTP — no new dependencies, uses existing Resend
- Option B: TOTP Authenticator App — requires `otplib` and `MFA_ENCRYPTION_KEY`

---

## Completed Features

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
