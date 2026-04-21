# Architecture

## Overview

Two independent deployments communicating over HTTP:

```
Browser
  └─ React / Vite (frontend :5173)
       └─ fetch(VITE_API_URL)
            └─ Next.js 15 App Router (backend :3000)
                 ├─ Supabase (PostgreSQL + Auth)
                 ├─ Stripe (payments + webhooks)
                 ├─ Vercel Blob (file uploads)
                 └─ Resend (transactional email)
```

Frontend and backend are fully decoupled and can be deployed to different origins.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Next.js 15 App Router, TypeScript |
| Auth | NextAuth v5, JWT session strategy |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe Checkout + Webhooks |
| File storage | Vercel Blob |
| Email | Resend (console fallback in dev) |
| Validation | Zod v4 |
| Testing | Vitest |

---

## Backend Directory Structure

```
backend/
  app/
    api/
      admin/
        attendance/route.ts   GET / POST / PATCH / DELETE — attendance management (admin only)
        events/route.ts        GET / POST / PATCH / DELETE — event calendar management (admin only)
        members/route.ts       GET / PATCH / DELETE — member management (admin only)
        sponsors/route.ts      POST / PUT / DELETE — sponsor management (admin only)
        staff/route.ts         POST / PUT / DELETE — staff management (admin only)
      attendance/route.ts      GET — current user's attendance + point total
      auth/
        [...nextauth]/route.ts  NextAuth catch-all (signin, signout, session)
        register/route.ts       POST — consume verification token, set password
      contact/route.ts          POST — contact form submission
      dev/seed/route.ts         POST — seed test data (404 in production)
      events/route.ts           GET — public upcoming event list (?all=true for all)
      membership/
        cancel/route.ts         POST — cancel subscription at period end
        route.ts                GET — current user's membership
      sponsors/route.ts         GET — public sponsor list
      staff/route.ts            GET — public staff list
      webhooks/
        forms/route.ts          POST — Google / Microsoft Forms attendance webhook
        stripe/route.ts         POST — Stripe subscription lifecycle webhook

  lib/
    interfaces/
      models.ts          User, Membership, Attendance, ClubEvent, StaffMember, Sponsor, VerificationToken
      repositories.ts    IUserRepository, IMembershipRepository, IAttendanceRepository,
                         IEventRepository, IStaffRepository, ISponsorRepository,
                         IVerificationTokenRepository
    services/
      attendanceService.ts
      membershipService.ts
      sponsorService.ts
      staffService.ts
      userService.ts
    repositories/
      stubs/             In-memory Maps — local dev, no DB required
      supabase/          Production Supabase implementations
    auth.ts              NextAuth v5 config, live role fetch on every request
    container.ts         DI — picks stubs vs Supabase based on SUPABASE_URL
    email.ts             Resend service + HTML templates
    rateLimit.ts         In-memory rate limiter (see Security Gaps)
    security.ts          addSecurityHeaders(), createSecureResponse()
    stripe.ts            Stripe client, webhook verification, subscription helpers
    supabase.ts          Supabase admin + anon client (lazy-initialized)
    upload.ts            Vercel Blob upload helper
    validation.ts        All Zod schemas
  middleware.ts          CORS + auth guards for page routes
```

---

## Repository Pattern

`container.ts` exports a single `repositories` object. When `SUPABASE_URL` is present it returns Supabase implementations; otherwise returns in-memory stubs. Route handlers and services only import from `container.ts`.

```ts
// Simplified
export const repositories = {
  user:              SUPABASE_URL ? userRepositorySupabase       : userRepositoryStub,
  membership:        SUPABASE_URL ? membershipRepositorySupabase : membershipRepositoryStub,
  attendance:        SUPABASE_URL ? attendanceRepositorySupabase : attendanceRepositoryStub,
  event:             SUPABASE_URL ? eventRepositorySupabase      : eventRepositoryStub,
  staff:             SUPABASE_URL ? staffRepositorySupabase      : staffRepositoryStub,
  sponsor:           SUPABASE_URL ? sponsorRepositorySupabase    : sponsorRepositoryStub,
  verificationToken: SUPABASE_URL ? verificationTokenRepositorySupabase : verificationTokenRepositoryStub,
}
```

The full app runs without any external services for local development.

---

## Authentication Flow

### Sign-in
1. Frontend POSTs credentials to NextAuth's `/api/auth/callback/credentials`.
2. `CredentialsProvider.authorize` in `auth.ts`:
   - **Production:** delegates to `supabase.auth.signInWithPassword`, fetches app profile via `repositories.user.findById`.
   - **Dev/stub:** fetches user from in-memory store, compares password with `bcrypt.compare`.
3. NextAuth signs a JWT containing `{ sub: userId, role }` and sets a session cookie.

### Session validation (per request)
Every call to `auth()` in a route handler executes the `session` callback:
```
JWT verified
  → repositories.user.findById(token.sub)   (live DB read)
  → session.user.role = freshUser.role      (always current)
```
The live DB read ensures role changes (promotion or demotion) take effect immediately. Without this, a demoted admin would retain the `ADMIN` role until JWT expiry — up to 30 days.

### Registration (new member)
```
Stripe Checkout completes
  → checkout.session.completed webhook
    → User created (status PENDING, no password)
    → Membership created (PENDING)
    → VerificationToken created (UUID, 24h TTL)
    → Welcome email → /register?token=<uuid>

User visits /register?token=<uuid>
  → POST /api/auth/register
    → Token validated + deleted (single-use)
    → Password set via Supabase Auth Admin API
    → Account activated
```

### Authorization tiers
| Tier | Routes |
|---|---|
| Public | `GET /api/sponsors`, `GET /api/staff`, `GET /api/events`, `POST /api/contact` |
| Authenticated | `GET /api/attendance`, `GET /api/membership`, `POST /api/membership/cancel` |
| Admin only | All `/api/admin/*` |
| Webhook (signature-verified) | `/api/webhooks/stripe`, `/api/webhooks/forms` |

---

## Payment and Membership Lifecycle

```
User clicks "Join"
  → Stripe Checkout session created
  → Redirect to Stripe-hosted payment page

checkout.session.completed
  → User + Membership (PENDING) created
  → VerificationToken created
  → Welcome email sent

invoice.payment_succeeded
  → Membership → ACTIVE, period dates updated
  → Confirmation email sent

invoice.payment_failed
  → Membership → PAST_DUE
  → Failure email sent

customer.subscription.deleted
  → Membership → CANCELLED
  → Cancellation email sent

customer.subscription.updated
  → Plan / period updated
  → Plan-change email sent if plan name changed

Member self-cancels:
  POST /api/membership/cancel
  → Stripe: cancel_at_period_end = true
  → Access continues to period end

Admin revokes:
  PATCH /api/admin/members { id, revokeAccess: true }
  → Stripe: subscription cancelled immediately
  → Membership → CANCELLED

Admin deletes member:
  DELETE /api/admin/members?id=<uuid>
  → Stripe: subscription cancelled immediately
  → Membership record deleted
  → User deleted from Supabase Auth (cascades to profiles)
```

---

## Attendance and Points

Points are the authoritative sum of `point_transactions.points` for a user. Each attendance record creates both an `attendance` row and a linked `point_transactions` row.

### Point sources
| Source | Mechanism |
|---|---|
| Admin manually records | `POST /api/admin/attendance` |
| Admin adjusts | `PATCH /api/admin/attendance { id, points }` |
| Google/Microsoft Forms | `POST /api/webhooks/forms` (see Webhooks section) |

### Forms webhook point resolution
1. Webhook validates `FORMS_WEBHOOK_SECRET` via `crypto.timingSafeEqual`.
2. Payload validated with Zod (`event_date` rejected if future or >30 days past).
3. Email resolved to UUID via `repositories.user.findByEmail`.
4. If `event_name` matches a row in the `events` table (case-insensitive), `events.points_value` is used as the canonical amount. Otherwise falls back to the submitted `points` field or `FORMS_DEFAULT_POINTS` env var.
5. Unmatched emails are stored in `unmatched_form_submissions` and a `200` is returned to prevent webhook retries.

---

## Security Model

### Input validation
All mutation endpoints use Zod schemas in `lib/validation.ts`. Key constraints:
- User IDs and attendance IDs validated as UUID before any DB call
- `points` enforced as integer 0–100
- Event dates rejected if in the future or more than 30 days past (forms webhook)
- Unknown fields stripped by Zod (`.strip()` is Zod's default)
- Password complexity enforced: min 8 chars, upper + lower + digit + special char

### Injection prevention
Supabase-js uses parameterized queries via PostgREST. Values are never interpolated into raw SQL. No raw SQL strings anywhere in the codebase.

### Webhook security
- **Stripe:** `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — HMAC-SHA256 verification over raw request body.
- **Forms:** `Authorization: Bearer <secret>` verified with `crypto.timingSafeEqual` — prevents timing-based secret discovery.

### Security headers (set on every response)
| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Basic policy — `unsafe-inline` present (see Security Gaps) |
| `Strict-Transport-Security` | Production only, `max-age=63072000; includeSubDomains` |

### CORS
`middleware.ts` restricts `Access-Control-Allow-Origin` to `FRONTEND_ORIGIN`. All other origins receive no CORS headers and cannot make credentialed requests.

### Rate limiting
| Limiter | Limit | Used on |
|---|---|---|
| `authRateLimit` | 5 req / 15 min | Login, register |
| `contactRateLimit` | 10 req / hour | Contact form |
| `generalRateLimit` | 100 req / 15 min | Authenticated user routes, public events |
| `adminRateLimit` | 200 req / 15 min | All admin routes |

---

## Security Gaps and Remediation

### 1. In-memory rate limiter — HIGH (pre-launch blocker)
**Risk:** `rateLimit.ts` uses a process-local `Map`. On Vercel serverless, each invocation may run in a separate process. The rate limiter provides no protection in production.

**Remediation:**
1. `npm install @upstash/ratelimit @upstash/redis` in backend.
2. Create a Redis database at upstash.com.
3. Rewrite `lib/rateLimit.ts` to use `@upstash/ratelimit` with the same exported function signatures (`authRateLimit`, `generalRateLimit`, `adminRateLimit`, `getClientIdentifier`) — callers require no changes.
4. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env.

### 2. CSP unsafe-inline — MEDIUM
**Risk:** `Content-Security-Policy` includes `unsafe-inline` for both scripts and styles. An XSS injection can execute arbitrary scripts.

**Remediation:**
1. Generate a per-request nonce in `lib/security.ts` → `addSecurityHeaders()`.
2. Pass nonce to Next.js `<Script>` and inline `<style>` tags via `nonce` attribute.
3. Remove `unsafe-inline` from CSP, replace with `'nonce-<value>'`.
4. Migrate React frontend inline styles (many in `AdminPage.jsx`, `DashboardPage.jsx`) to CSS modules or a stylesheet to eliminate the need for `style-src unsafe-inline` entirely.

This is deferred post-launch due to the extent of inline styles in the frontend.

### 3. Stripe webhook not idempotent — LOW
**Risk:** If Stripe retries a `checkout.session.completed` event (network timeout, etc.), a second user and membership will be created for the same email.

**Remediation:** In `app/api/webhooks/stripe/route.ts`, before creating a user, call `repositories.user.findByEmail(session.customer_details.email)`. If a user exists, skip creation and reuse the existing user ID. Same guard for membership: check `findByStripeCustomerId` before inserting.

### 4. MFA not implemented — LOW
**Risk:** Single-factor authentication. A compromised password grants full account access.

**Remediation:** See `docs/mfa-and-forms-plan.md` for two implementation paths — Email OTP (no new dependencies) and TOTP Authenticator App (`otplib`).

### 5. Contact form email not sent — INFORMATIONAL
**Risk:** Contact form submissions are logged to console only. No admin notification.

**Remediation:** Add `sendContactNotification(name, email, message)` to `lib/email.ts` and call it in `app/api/contact/route.ts`.

---

## File Uploads

Staff photos and sponsor logos use `lib/upload.ts` with Vercel Blob (`@vercel/blob`). Files are stored at a CDN URL returned by `put()`. Requires `BLOB_READ_WRITE_TOKEN`.

---

## Supabase Schema

Key tables (full DDL in `backend/supabase/additional_tables.sql`):

| Table | Purpose |
|---|---|
| `auth.users` | Supabase managed — email, password hash, UUID primary key |
| `profiles` | App user data — `id` (FK → auth.users), `full_name`, `email`, `role` |
| `memberships` | `user_id`, `status`, `membership_type_id`, Stripe IDs, dates |
| `membership_types` | Plan definitions — `name`, `price`, `duration_months` |
| `events` | `title`, `description`, `event_date` (DATE), `points_value`, `created_by` |
| `attendance` | `user_id`, `event_id` (FK → events, SET NULL), `check_in_time` |
| `point_transactions` | `user_id`, `event_id`, `attendance_id` (FK → attendance, CASCADE), `points`, `reason` |
| `staff` | `name`, `role`, `bio`, `email`, `image_url`, `order`, `is_active` |
| `sponsors` | `name`, `logo_url`, `website_url`, `tier`, `order`, `is_active`, `start_date`, `end_date` |
| `verification_tokens` | `identifier` (email), `token` (UUID), `expires` |
| `unmatched_form_submissions` | `email`, `raw_payload` (JSONB), `received_at`, `resolved` |

Deleting an `attendance` row cascades to `point_transactions` via `attendance_id FK ON DELETE CASCADE`.

---

## Environment Variables

### Backend (`backend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Signs JWT tokens — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full backend URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Used in email links |
| `FRONTEND_ORIGIN` | Yes | Allowed CORS origin |
| `STRIPE_SECRET_KEY` | Yes | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Verifies Stripe webhook payloads |
| `STRIPE_PRICE_ID_MONTHLY` | Yes | Stripe price ID for monthly plan |
| `STRIPE_PRICE_ID_ANNUAL` | Yes | Stripe price ID for annual plan |
| `SUPABASE_URL` | Prod | Supabase project URL (omit to use in-memory stubs) |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod | Supabase service role key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod | Supabase anon key |
| `RESEND_API_KEY` | Prod | Resend API key |
| `FROM_EMAIL` | Prod | Sender address for outbound email |
| `GROUPME_INVITE_LINK` | Optional | Included in welcome email |
| `BLOB_READ_WRITE_TOKEN` | Prod | Vercel Blob token |
| `FORMS_WEBHOOK_SECRET` | Prod | Shared secret for Google/MS Forms webhook |
| `FORMS_DEFAULT_POINTS` | Optional | Default points per form submission (default: 1) |
| `UPSTASH_REDIS_REST_URL` | Prod | Upstash Redis URL (once rate limiter is migrated) |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Upstash Redis token |
| `SEED_ADMIN_EMAIL` | Dev | Seed admin email (default: `admin@test.com`) |
| `SEED_ADMIN_PASSWORD` | Dev | Seed admin password (default: `Admin1234!`) |
| `SEED_MEMBER_EMAIL` | Dev | Seed member email (default: `member@test.com`) |
| `SEED_MEMBER_PASSWORD` | Dev | Seed member password (default: `Member1234!`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL (e.g. `http://localhost:3000`) |
