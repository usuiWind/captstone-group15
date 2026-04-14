# MFA and Forms-Based Attendance — Planning Doc

**Status:** Forms-based attendance is **fully implemented** (see `app/api/webhooks/forms/route.ts` and `docs/api-webhooks.md` for the complete reference). Email OTP MFA for admin accounts is **fully implemented** (see below). TOTP (Option B) is not built.

---

## Feature 1: Two-Factor Authentication (MFA)

Two options below, ranked by implementation complexity. Both integrate with the existing `CredentialsProvider` + JWT flow in `lib/auth.ts` without replacing NextAuth or restructuring the auth pipeline.

---

### Option A — Email OTP ✅ IMPLEMENTED (admin accounts only)

**Scope note:** The implementation targets admin accounts exclusively. Member accounts sign in with password only, unchanged.

**What was built.** After a correct password, a 6-digit OTP is generated, bcrypt-hashed (cost 8), stored in `admin_otp_codes`, and emailed via Resend. The JWT is only issued after the code is validated. Member accounts are unaffected.

**DB table**

```sql
admin_otp_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code_hash   text not null,         -- bcrypt hash of the 6-digit code
  expires_at  timestamptz not null,  -- 10 minutes from creation
  used        boolean not null default false,
  created_at  timestamptz default now()
)
```

Index on `(user_id, expires_at)` for fast lookup.

**Files added / changed**

| File | What changed |
|---|---|
| `backend/supabase/additional_tables.sql` | Added `admin_otp_codes` table + index |
| `lib/interfaces/models.ts` | Added `AdminOtpCode`, `CreateAdminOtpInput` |
| `lib/interfaces/repositories.ts` | Added `IAdminOtpRepository` |
| `lib/repositories/supabase/otpRepository.ts` | New Supabase implementation |
| `lib/repositories/stubs/otpRepositoryStub.ts` | New in-memory stub |
| `lib/repositories/supabase/index.ts` | Exports `otpRepositorySupabase` |
| `lib/repositories/stubs/index.ts` | Exports `otpRepositoryStub` |
| `lib/container.ts` | Registers `otp` repository |
| `lib/email.ts` | Added `sendAdminOtpEmail(to, otp)` |
| `lib/auth.ts` | Extended `CredentialsProvider` with `otp` field; admins require valid OTP |
| `app/api/auth/admin/send-otp/route.ts` | New endpoint — validates credentials, sends OTP, constant-time response |
| `frontend/src/api/services/authService.js` | Added `requestAdminOtp()`, updated `signIn()` to accept `otp` |
| `frontend/src/pages/LoginPage.jsx` | Two-step admin login flow with OTP input, Resend, and Back controls |

**How to test locally:** See `docs/local-testing.md` step 4b-admin. OTP codes are printed to the backend terminal when `RESEND_API_KEY` is not set.

**New env vars:** None required. Uses existing `RESEND_API_KEY` + `FROM_EMAIL`.

**Differences from original plan**
- Table is named `admin_otp_codes` (not `mfa_codes`) and scoped to admins
- Code is stored as a bcrypt hash (`code_hash`), not plaintext
- Step-1 endpoint is at `app/api/auth/admin/send-otp` (not `app/api/auth/mfa/send-otp`)
- Repository interface is `IAdminOtpRepository` (not `IMfaCodeRepository`)
- `findLatestForUser` replaces `findByUserId` — returns the newest valid, unused code

**Pros**
- No new npm dependencies
- Reuses existing Resend, `verification_tokens` pattern, and `emailService`
- Zero changes to JWT callbacks
- Degrades gracefully in stub mode (console.log email fallback already works)
- Constant-time `send-otp` response prevents user enumeration

**Cons**
- Email delivery adds latency at login time
- Compromised inbox defeats both factors simultaneously (email is also the account recovery path)
- Requires a two-step login UX on the frontend (implemented)

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

## Feature 2: Attendance Points from Microsoft / Google Forms ✅ IMPLEMENTED

Points are auto-created when a Google/Microsoft Forms response is submitted. See `docs/api-webhooks.md#post-apiwebhooksforms` for the full reference and setup instructions.

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
