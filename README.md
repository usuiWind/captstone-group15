# Club Membership System

React (Vite) frontend + Next.js 16 backend with Stripe payments, NextAuth v5,
Supabase (PostgreSQL), and Resend email.

## Quick Start

```bash
# Backend (port 3000)
cd backend && npm install && npm run dev

# Frontend (port 5173)
cd frontend && npm install && npm run dev
```

Copy `backend/.env.local` and fill in the required values (see below).

## Required Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `NEXTAUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev |
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same location |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` CLI output |
| `RESEND_API_KEY` | resend.com → API Keys |
| `FROM_EMAIL` | Verified sending address in Resend |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |

Without Supabase vars, the app runs on in-memory stubs (data resets on restart).
Without Resend vars, emails are logged to the console instead of sent.

## Docs

| File | Contents |
|------|----------|
| `docs/architecture.md` | System design, data flow, repo pattern |
| `docs/api-auth.md` | `/api/auth/*` — registration, sign-in, session |
| `docs/api-membership.md` | `/api/membership` — get status, cancel |
| `docs/api-attendance.md` | `/api/attendance` — member points |
| `docs/api-admin.md` | `/api/admin/*` — members, staff, sponsors |
| `docs/api-public.md` | `/api/staff`, `/api/sponsors`, `/api/contact` |
| `docs/api-webhooks.md` | `/api/webhooks/stripe` — payment events |
| `docs/local-testing.md` | Full local dev guide: seed accounts, Postman sign-in, all endpoints |
| `docs/testing.md` | Curl smoke tests and Stripe CLI webhook workflow |
| `docs/next-steps.md` | Prioritized task list for remaining work |
