# MFA and Forms-Based Attendance — Planning Doc

**MFA Option A (Email OTP) backend is complete.** Frontend work is pending (see section below).

---

## Feature 1: Two-Factor Authentication (MFA)

Two options below, ranked by implementation complexity. Both integrate with the existing `CredentialsProvider` + JWT flow in `lib/auth.ts` without replacing NextAuth or restructuring the auth pipeline.

---

### Option A — Email OTP (simpler, recommended first)

**What it is.** After a correct password, generate a 6-digit code, email it via Resend (already configured), and require it before NextAuth issues the JWT. Two-step login UX on the frontend.

**New DB table needed**

```sql
mfa_codes (
  id          uuid primary key,
  user_id     uuid references users(id),
  code        varchar(6),
  expires_at  timestamptz,
  created_at  timestamptz
)
```

Nearly identical shape to `verification_tokens` — the repository implementation can follow the same pattern.

**New env vars:** None. Resend + `FROM_EMAIL` are already wired.

**Files to change**

| File | What changes |
|---|---|
| `lib/auth.ts` | Add `otpCode` to `credentials` declaration; after password check, look up + validate code before returning user |
| `lib/validation.ts` | Add `sendOtpSchema` (email + password) and `verifyOtpSchema` (email + password + 6-digit code) |
| `lib/email.ts` | Add `emailService.sendOtpCode(to, code)` method and template |
| `lib/interfaces/models.ts` | Add `MfaCode` model and `CreateMfaCodeInput` |
| `lib/interfaces/repositories.ts` | Add `IMfaCodeRepository` with `create`, `findByUserId`, `delete` |
| `lib/container.ts` | Register the new repository |
| New: `app/api/auth/mfa/send-otp/route.ts` | Step-1 endpoint — validates password, sends OTP, returns no session data |
| New: `lib/repositories/supabase/mfaCodeRepository.ts` | Supabase implementation |
| New: `lib/repositories/stubs/mfaCodeRepositoryStub.ts` | In-memory stub for dev |

**Why the two-endpoint split matters.** NextAuth's `CredentialsProvider` has no "pending" session state — it either returns a user (JWT issued) or `null` (rejected). The step-1 endpoint validates the password but returns no session. Only the second call to `authorize` (with `otpCode` present) completes the JWT.

**Pros**
- No new npm dependencies
- Reuses existing Resend, `verification_tokens` pattern, and `emailService`
- Zero changes to JWT callbacks
- Degrades gracefully in stub mode (console.log email fallback already works)

**Cons**
- Email delivery adds latency at login time
- Compromised inbox defeats both factors simultaneously (email is also the account recovery path)
- Requires a two-step login UX on the frontend

---

## Supabase Setup (required before testing with Supabase)

Run this in the Supabase SQL editor:

```sql
create table mfa_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        varchar(6) not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Only one active OTP per user
create unique index mfa_codes_user_id_idx on mfa_codes (user_id);
```

---

## Frontend Work Remaining (Option A)

The backend exposes two steps:

### Step 1 — `POST /api/auth/mfa/send-otp`

Call this when the user submits email + password on the login form.

**Request body:**
```json
{ "email": "user@example.com", "password": "their-password" }
```

**Success response:** `{ "success": true }` with HTTP 200.  
**Failure response:** HTTP 401 (wrong credentials) or 400 (validation error).

On success, show a second input asking for the 6-digit code that was just emailed.

### Step 2 — NextAuth `signIn('credentials', ...)`

Call this when the user submits the OTP code.

```js
import { signIn } from 'next-auth/react'

const result = await signIn('credentials', {
  redirect: false,
  email,
  password,
  otpCode,  // the 6-digit code from the email
})

if (result?.error) {
  // Show "Invalid or expired code" error
} else {
  // Redirect to /dashboard
}
```

### UI Flow

1. **Login page** (`LoginPage.jsx`) shows email + password fields (same as now).
2. On submit → call `POST /api/auth/mfa/send-otp`.
   - If 401: show "Invalid email or password."
   - If 200: switch to a second view showing a 6-digit code input ("Check your email for a verification code").
3. On OTP submit → call `signIn('credentials', { email, password, otpCode })`.
   - If error: show "Invalid or expired code. Request a new one."
   - Include a "Resend code" button that re-calls step 1.
   - On success: redirect to `/dashboard`.

### Files to change in the frontend

| File | Change |
|---|---|
| `frontend/src/pages/LoginPage.jsx` | Add two-step state: `idle → codeSent → success`. Add OTP input view. |
| `frontend/src/api/services/authService.js` | Add `sendOtp(email, password)` that calls `POST /api/auth/mfa/send-otp`. |
| `frontend/src/context/AuthContext.jsx` | Update `login()` to accept `otpCode` and pass it to `signIn`. |

No new pages or routes needed — the two steps live inside the existing `LoginPage`.

---

### Option B — TOTP Authenticator App (stronger, more setup)

**What it is.** Users enroll once by scanning a QR code into Google Authenticator or Authy. At login they supply the 30-second rotating 6-digit code alongside their password.

**New DB column needed**

Add `totp_secret varchar` to the `users` table (or create a separate `user_mfa` table). The secret must be encrypted at rest before storing — use AES-256 with a key from `MFA_ENCRYPTION_KEY`.

**New env vars**
- `MFA_ENCRYPTION_KEY` — 32-byte secret for encrypting the TOTP secret before storing

**New dependency**
- `otplib` — one package, no native bindings, provides `generateSecret()`, `keyuri()` for QR code, and `check(token, secret)` for validation

**Files to change**

| File | What changes |
|---|---|
| `lib/auth.ts` | Add `totpCode` to `credentials`; after password check, if user has a TOTP secret stored, validate the code with `otplib` before returning user |
| `lib/interfaces/repositories.ts` | Add `setTotpSecret(id, encryptedSecret)` and `getTotpSecret(id)` to `IUserRepository` |
| `lib/repositories/supabase/userRepository.ts` | Implement those two methods |
| `lib/repositories/stubs/userRepositoryStub.ts` | Stub equivalents |
| `lib/validation.ts` | Add `totpEnrollConfirmSchema` (6-digit numeric string) |
| New: `app/api/user/mfa/setup/route.ts` | Authenticated route — generates secret + returns QR code URI for display |
| New: `app/api/user/mfa/confirm/route.ts` | Validates first code from user, persists encrypted secret |

**Pros**
- Offline — no email delivery at login, no latency
- Industry-standard method users already know
- Codes rotate every 30 seconds, replays nearly impossible

**Cons**
- Users need an authenticator app (higher onboarding friction)
- Requires an account recovery flow (backup codes) — more surface area
- Secret storage requires correct encryption logic
- New enrollment UI (QR code display) needed on the frontend

---

## Feature 2: Attendance Points from Microsoft / Google Forms

Currently points are created manually by admins via `POST /api/admin/attendance`. This feature auto-creates attendance records when a form is submitted.

### Integration Strategy: Webhook (recommended)

Mirrors the existing Stripe webhook pattern at `app/api/webhooks/stripe/route.ts` exactly.

- **Google Forms** → Apps Script `onFormSubmit` trigger → `UrlFetchApp.fetch()` to your endpoint
- **Microsoft Forms** → Power Automate "When a new response is submitted" → HTTP action to your endpoint

No polling or cron job needed. The only new infrastructure is one endpoint and one Supabase table.

---

### New Endpoint: `POST /api/webhooks/forms/route.ts`

Sequence:

1. Verify shared secret from `Authorization: Bearer <secret>` header using `crypto.timingSafeEqual` (same principle as Stripe's signature check)
2. Validate payload with a new Zod schema in `validation.ts`
3. Resolve `email` → `userId` via `repositories.user.findByEmail`
4. If matched → call `attendanceService.createAttendance`
5. If unmatched → insert into `unmatched_form_submissions` log table, return `200` (never return `404` — Power Automate will retry indefinitely on non-2xx)

No new service class needed. `AttendanceService` handles step 4 as-is.

---

### Form Field Mapping Convention

Admins must name form fields exactly as below when building forms:

| Form field name | Maps to | Notes |
|---|---|---|
| `email` (auto-collected by platform) | → `userId` via lookup | Enable "Collect email addresses" in Google Forms; "Record name" in MS Forms |
| `event_name` | `eventName` | Admin labels this when creating the form |
| `event_date` | `date` | ISO 8601 preferred; validate: reject future dates, reject > 30 days past |
| `points` | `points` | Or omit and use `FORMS_DEFAULT_POINTS` env var to fix a value per submission |

Using a fixed `FORMS_DEFAULT_POINTS` instead of a form field reduces the attack surface (no user can submit an inflated point value).

The new Zod schema should enforce: `points` max 100 (already in `createAttendanceSchema`), strict date range, unknown fields stripped.

---

### Identity Matching

The hardest part. Form submitters provide an email; the attendance record needs a UUID. Three cases:

**Matched** — `repositories.user.findByEmail(email)` returns a user. Proceed normally.

**Unmatched** — Person used a different email, or hasn't registered yet. Insert into `unmatched_form_submissions` (see below) and return `200`. An admin can review and reconcile manually.

**Policy** — Document that form submissions must use the same email as the portal account. Surface a reminder in the form's confirmation message.

---

### New DB Table: `unmatched_form_submissions`

```sql
unmatched_form_submissions (
  id           uuid primary key,
  email        text,
  raw_payload  jsonb,
  received_at  timestamptz,
  resolved     boolean default false
)
```

No repository interface needed — a direct `supabaseAdmin.from('unmatched_form_submissions').insert()` call in the webhook handler is sufficient, consistent with how the Stripe handler uses `repositories` directly for one-off operations.

An admin can query this table in the Supabase dashboard or a future admin UI endpoint.

---

### New Env Vars

| Var | Purpose |
|---|---|
| `FORMS_WEBHOOK_SECRET` | Shared secret verified on every inbound POST |
| `FORMS_DEFAULT_POINTS` | Optional fixed point value per submission (omit if points are a form field) |

---

### Security Considerations

- Verify `FORMS_WEBHOOK_SECRET` before any processing, using `crypto.timingSafeEqual` to prevent timing attacks
- Apply `generalRateLimit` using `getClientIdentifier` on the endpoint
- Validate `points` ≤ 100 (already in `createAttendanceSchema`) — do not trust the submitted value blindly
- Reject dates more than 30 days in the past to prevent bulk backdating
- Return generic error messages only — no internal details (follow `createSecureErrorResponse` pattern)
- The `middleware.ts` Stripe bypass (`pathname.startsWith('/api/webhooks')`) already covers this endpoint — no auth middleware change needed

---

### Total New Surface Area

**Forms feature:**
- 1 new route file (`app/api/webhooks/forms/route.ts`)
- 1 new Zod schema in `lib/validation.ts`
- 1 new Supabase table (`unmatched_form_submissions`)
- 2 new env vars
- Zero changes to existing services, repositories, or models

**MFA Option A (email OTP):**
- 1 new Supabase table (`mfa_codes`)
- 1 new API route (`app/api/auth/mfa/send-otp/route.ts`)
- Changes to 5 existing files
- 2 new repository files
- 1 update to `container.ts`
- Zero new npm dependencies

**MFA Option B (TOTP):**
- 1 new DB column or table
- 2 new API routes
- Changes to 5 existing files
- 1 new npm dependency (`otplib`)
- 1 new env var (`MFA_ENCRYPTION_KEY`)
