# Testing Guide

## Prerequisites

- Node.js 22.12+
- Both dev servers running (see README)
- No Supabase or Stripe account needed for local smoke tests

---

## 1. Start Dev Servers

```bash
# Terminal 1
cd backend && npm run dev
# → http://localhost:3000

# Terminal 2
cd frontend && npm run dev
# → http://localhost:5173
```

---

## 2. Smoke Test API (curl)

These run against the in-memory stubs — no database required.

```bash
# Public endpoints (no auth)
curl http://localhost:3000/api/staff
curl http://localhost:3000/api/sponsors

# Contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith","email":"a@b.com","message":"Hi"}'

# Missing field → expect 400
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice"}'

# Auth-protected without session → expect 401
curl http://localhost:3000/api/membership
curl http://localhost:3000/api/attendance

# Admin without session → expect 403
curl http://localhost:3000/api/admin/members
```

---

## 3. Registration Flow (stub mode)

Because emails go to console in local dev, you can pull the token directly.

```bash
# Step 1: watch backend terminal for the registration link logged by email.ts
# It looks like: [EMAIL STUB] To: alice@example.com | Subject: Welcome...
# The token is in the link: /register?token=<uuid>

# Step 2: Register using that token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"token":"<uuid-from-log>","name":"Alice Smith","password":"password123"}'
# → expect 200 with user object
```

---

## 4. Stripe Webhook (test mode)

Requires Stripe CLI and test keys in `.env.local`.

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

Check backend terminal for processing logs. Verify the stub membership repository
received state changes by hitting `GET /api/admin/members` (requires admin session).

---

## 5. Build Check

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Expected: frontend builds clean. Backend currently has 7 pre-existing TypeScript
errors in `membershipService.ts`, `stripe.ts`, and `validation.ts` (Stripe API
version and Zod v4 incompatibilities — tracked in `next-steps.md`).

---

## 6. MFA Email OTP Flow (stub mode)

In stub mode the OTP is printed to the backend terminal instead of emailed,
so you can test the full two-step flow without Resend configured.

### Step 1 — Send OTP

First seed the database so a user exists with a password:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Then request an OTP for the admin account:

```bash
curl -X POST http://localhost:3000/api/auth/mfa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin1234!"}'
# → { "success": true }
```

Watch the backend terminal for a line like:

```
[EMAIL STUB] To: admin@test.com | Subject: Your FITP verification code
```

The 6-digit code is stored in memory but not printed directly. To retrieve it
during testing you can temporarily add a `console.log(code)` in
`app/api/auth/mfa/send-otp/route.ts` before the `create` call, or use the
frontend login form once it is wired up.

### Step 2 — Complete sign-in (NextAuth)

```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin1234!","otpCode":"<6-digit-code>"}'
# → session cookie set, redirects to /dashboard
```

### Error cases to verify

```bash
# Wrong password at step 1 → expect 401
curl -X POST http://localhost:3000/api/auth/mfa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrongpassword"}'

# Malformed OTP (not 6 digits) → expect 400
curl -X POST http://localhost:3000/api/auth/mfa/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin1234!","otpCode":"123"}'

# Valid credentials but no OTP provided to NextAuth → expect sign-in failure
# (authorize() returns null when otpCode is missing)
```

### OTP expiry

OTPs expire after **5 minutes**. Requesting a new OTP via `send-otp` invalidates
the previous one immediately — each call to the endpoint replaces the stored code.

---

## 7. Access Control Checks (browser)

| URL | Expected result |
|-----|----------------|
| `/dashboard` (logged out) | Redirect to `/login` |
| `/admin` (logged in as MEMBER) | Redirect to `/dashboard` |
| `/member-register-form` | Same page as `/register` |
