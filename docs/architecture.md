# Architecture

## Overview

Two independent deployments that communicate over HTTP:

```
Browser → React/Vite (frontend :5173)
              ↓ fetch VITE_API_URL
       Next.js App Router (backend :3000)
              ↓
         Supabase (PostgreSQL) + Stripe + Vercel Blob + Resend
```

## Backend Structure

```
backend/
  app/api/          ← Next.js route handlers (HTTP layer only)
  lib/
    interfaces/     ← TypeScript contracts (models.ts, repositories.ts)
    services/       ← Business logic (no DB or HTTP knowledge)
    repositories/
      stubs/        ← In-memory Maps (local dev, no DB needed)
      supabase/     ← Production implementations
    container.ts    ← Picks stubs vs Supabase based on SUPABASE_URL env var
    auth.ts         ← NextAuth v5 config
    email.ts        ← Resend (falls back to console if no API key)
    rateLimit.ts    ← In-memory limiter (⚠ not shared across serverless instances)
    security.ts     ← addSecurityHeaders(), createSecureResponse()
    stripe.ts       ← Stripe client + webhook constructor
    validation.ts   ← Zod schemas
```

## Repository Pattern / DI

`container.ts` exports a single `repositories` object. If `SUPABASE_URL` is set it
returns Supabase implementations; otherwise returns in-memory stubs. Services and
route handlers import from `container.ts` only — they never reference a specific DB.

Staff and sponsor repositories are always stubs (data lives in the frontend).

## Auth Flow

1. `POST /api/auth/register` — consumes a single-use token, sets name + password
2. `POST /api/auth/signin` (NextAuth) — credentials → JWT `{ id, email, role }`
3. `middleware.ts` — rejects unauthenticated requests to `/api/membership`, `/api/attendance`
4. Route handlers call `auth()` and check `session.user.role === 'ADMIN'` for admin routes

## Payment / Membership Lifecycle

```
Stripe Checkout → checkout.session.completed webhook
  → creates User (PENDING) + Membership (PENDING) + VerificationToken
  → sends welcome email with /register?token=<uuid>

User clicks link → POST /api/auth/register
  → token validated + deleted, password set, account activated

invoice.payment_succeeded  → Membership status = ACTIVE
invoice.payment_failed     → Membership status = PAST_DUE
customer.subscription.deleted → Membership status = CANCELLED
POST /api/membership/cancel → Stripe cancel_at_period_end = true
```

## Key Known Gaps

| Gap | Risk | Fix |
|-----|------|-----|
| In-memory rate limiter | No protection on Vercel (serverless) | Replace with Upstash Redis |
| `unsafe-inline` in CSP | XSS escalation if injected | Nonce-based CSP |
| Stripe API version mismatch | Build warning | Bump `stripe` package |
| Zod v4 API change | Build error in `validation.ts` | Update schema syntax |
