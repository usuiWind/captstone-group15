# What Comes Next

Priority order. Each task is scoped for one sitting.

---

## P0 — Fix build errors ~~(blocker for CI/deploy)~~ ✅ DONE

~~**Task 1: Fix Zod v4 incompatibility**~~ ✅
- Fixed `invalid_type_error` → `error`, `errorMap` → `error`, `.errors` → `.issues` in `backend/lib/validation.ts`.

~~**Task 2: Fix Stripe API version mismatch**~~ ✅
- Updated API version to `2026-02-25.clover` in `backend/lib/stripe.ts`.
- Also fixed `current_period_start`/`current_period_end` to read from `subscription.items.data[0]` (moved in Stripe API `2024-09-30`).

~~**Task 3 (bonus): Admin panel membership data**~~ ✅
- Added `findAll()` to `IMembershipRepository`, both stub and Supabase implementations.
- `MembershipService.getAllMemberships()` now returns real data.

~~**Task 4 (bonus): Dead `/member-register-form` route**~~ ✅
- Added route alias in `frontend/src/App.jsx` pointing to `RegisterPage`.

~~**Task 5 (bonus): Duplicate `transform` key in Navbar.jsx**~~ ✅
- Removed the dead static `transform` override; animated transform now takes effect correctly.

---

---

## P1 — Email and environment setup (required before user-facing demo)

**Task 3: Set up Resend**
1. Create account at resend.com, verify a sending domain.
2. Add `RESEND_API_KEY=re_...` and `FROM_EMAIL=noreply@yourdomain.com` to `.env.local`.
3. Also set `NEXT_PUBLIC_APP_URL=http://localhost:3000` (used in welcome email link).
4. Send a test welcome email by triggering `checkout.session.completed` with Stripe CLI.

**Task 4: Set Supabase env vars**
Add to `.env.local`:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
Container auto-switches to Supabase repos when `SUPABASE_URL` is present.
Run `backend/supabase/additional_tables.sql` in Supabase SQL editor first.

---

## P2 — Rate limiter (required before public launch)

**Task 5: Replace in-memory rate limiter with Upstash Redis**
- Sign up at upstash.com, create a Redis database, copy REST URL + token.
- `npm install @upstash/ratelimit @upstash/redis` in backend.
- Rewrite `backend/lib/rateLimit.ts` to use `@upstash/ratelimit`.
  The exported API (`authRateLimit`, `generalRateLimit`, `getClientIdentifier`)
  should stay the same so callers don't change.
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`.
- ~1 hour.

---

## P3 — Idempotency for Stripe webhooks

**Task 6: Guard against duplicate `checkout.session.completed`**
- Before creating a user, check `repositories.user.findByEmail(session.customer_details.email)`.
- If user exists, skip creation and reuse the existing user ID.
- Same for membership: check `findByStripeCustomerId` before creating.
- File: `backend/app/api/webhooks/stripe/route.ts`, ~20 min.

---

## P4 — Staff/sponsor persistence

**Task 7: Supabase repositories for staff and sponsors**
- Currently these use in-memory stubs and reset on every restart.
- Create `backend/lib/repositories/supabase/staffRepository.ts` and
  `sponsorRepository.ts` following the same pattern as `userRepository.ts`.
- Wire them in `container.ts`.
- Add corresponding tables to Supabase (columns: `id`, `name`, `role/tier`,
  `bio`, `email`, `image_url`, `order`, `is_active`, `created_at`).

---

## P5 — Contact form email

**Task 8: Send contact form notifications**
- Add `sendContactNotification(name, email, message)` to `lib/email.ts`.
- Call it in `backend/app/api/contact/route.ts` after validation passes.
- ~20 min.

---

## P6 — CSP nonce (post-launch hardening)

**Task 9: Replace `unsafe-inline` with nonce-based CSP**
- Generate a per-request nonce in `addSecurityHeaders()`.
- Pass nonce to Next.js `<Script>` and `<style>` tags.
- More involved; defer until after launch.

---

## Deployment Checklist (when ready)

- [ ] Set all env vars in Vercel dashboard (both frontend and backend projects)
- [ ] Set `NEXTAUTH_URL` to production backend URL
- [ ] Set `FRONTEND_ORIGIN` to production frontend URL
- [ ] Set Stripe webhook endpoint to `https://<backend>.vercel.app/api/webhooks/stripe`
- [ ] Rotate `NEXTAUTH_SECRET` — do not reuse the dev value
- [ ] Verify Resend sending domain is confirmed
- [ ] Run E2E flow: Stripe test checkout → email → register → dashboard
