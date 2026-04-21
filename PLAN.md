# FITP UH — Outstanding Work

Everything that still needs to be done before the app is production-ready.
Items are grouped by category and ordered by priority within each group.

---

## 1. Database (Supabase SQL — run first)

These must be applied in the Supabase SQL Editor before real API testing works.

### 1a. Add `attendance_id` to `point_transactions` ⚠️ CRITICAL

Without this, creating or deleting any attendance record will fail silently.
The attendance repository writes `attendance_id` on insert and deletes by it.

```sql
ALTER TABLE public.point_transactions
  ADD COLUMN IF NOT EXISTS attendance_id INTEGER
  REFERENCES public.attendance(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pt_attendance
  ON public.point_transactions(attendance_id);
```

### 1b. Add `unmatched_form_submissions` table

Used by the forms webhook to log check-ins that don't match any registered user.
Admins review and reconcile manually.

```sql
CREATE TABLE IF NOT EXISTS public.unmatched_form_submissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  raw_payload JSONB       NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE
);
```

---

## 2. Security Vulnerabilities

### 2a. Plaintext OTP stored in database — NOT IN SCOPE

Member MFA OTP is not implemented in the current scope. No fix needed.

### 2b. Webhook auth bypass via token truncation — ✅ FIXED

**File:** `backend/app/api/webhooks/forms/route.ts`

`Buffer.alloc` + `Buffer.copy` truncated longer tokens silently, allowing a prefix
bypass. Fixed by allocating `tokenBuf` from the actual token string and rejecting
on length mismatch before `timingSafeEqual`.

### 2c. Unauthenticated PII via public Apps Script endpoint — ✅ PARTIALLY MITIGATED

**File:** `frontend/src/pages/MemberDashboard.jsx`

The hardcoded Apps Script URL has been removed from source and moved to
`VITE_APPS_SCRIPT_URL` in `frontend/.env` (copy from `frontend/.env.example`).
This removes the URL from the git history going forward.

**Remaining action required (Google-side):** In the Apps Script editor, go to
Deploy → Manage deployments → Edit → set "Who has access" to your organization's
domain (not "Anyone"). This is the only way to prevent unauthenticated calls.

---

## 3. Environment Variables — Fill in `.env`

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or your deployed URL |
| `FRONTEND_ORIGIN` | `http://localhost:5173` (dev) or your deployed frontend URL |
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe dashboard → Products → copy price ID |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe dashboard → Products → copy price ID |
| `RESEND_API_KEY` | resend.com → API Keys |
| `FROM_EMAIL` | Verified sender address on Resend |
| `FORMS_WEBHOOK_SECRET` | `openssl rand -base64 32` (also goes in Apps Script Properties) |

**Optional (can skip for initial testing):**
- `BLOB_READ_WRITE_TOKEN` — only needed for staff/sponsor image uploads
- `GROUPME_INVITE_LINK` — optional welcome message link
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiter falls back to in-memory without these

### Stripe webhook events to listen for
When setting up the webhook endpoint in Stripe Dashboard, select these events:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

---

## 4. Apps Script Integration

All three `.gs` files have been reviewed and are complete. No further changes needed.

**How the scripts relate:**
- `membershipStatus.gs` defines `SIGNUP_SHEET_URL` (shared global used by all three scripts) and runs hourly to set Active/Nonactive status in the Sign Up sheet
- `onFormSubmit.gs` deduplicates Sign Up sheet rows on every form submission
- `membershipPoints.gs` calculates points from Event Responses and syncs check-ins to the backend via `syncRowToBackend_` — **updated script has been sent to the other developer**

### 4a. Add Script Properties (still required)

In Apps Script editor → Project Settings → Script Properties:

| Property | Value |
|---|---|
| `BACKEND_URL` | Your deployed backend URL (e.g. `https://your-app.vercel.app`) |
| `FORMS_WEBHOOK_SECRET` | Same value as `FORMS_WEBHOOK_SECRET` in your backend `.env` |

---

## 5. Contact Form Email (not yet implemented)

`POST /api/contact` accepts submissions but never sends a notification email.

**File:** `backend/app/api/contact/route.ts`

Add a call to `emailService` after validation:

```ts
await emailService.sendContactNotification(name, email, message)
```

Then add `sendContactNotification` to `backend/lib/email.ts` using the existing
Resend pattern from `sendOtpCode` / `sendPaymentSuccessEmail`.

---

## 6. Testing Checklist

Use this to verify everything works end-to-end before demo.

- [ ] SQL changes applied (sections 1a + 1b above)
- [ ] `.env` filled in with real keys
- [ ] `POST /api/dev/seed` — creates test admin + member accounts
- [ ] Member login → dashboard loads with name (Apps Script fallback if not in sheet)
- [ ] Admin login → OTP email received → admin dashboard loads
- [ ] Stripe test payment → membership status updates in dashboard
- [ ] Check-in form submission → Apps Script runs → attendance record appears in Events tab
- [ ] Staff/sponsor CRUD in admin panel
- [ ] Contact form submission received by team email
