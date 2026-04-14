# Local Testing Guide

No database or Stripe account required. Everything runs in-memory.

---

## Step 1 — Environment

Create `backend/.env.local`:

```env
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
FORMS_WEBHOOK_SECRET=test-forms-secret
FORMS_DEFAULT_POINTS=1
```

Leave `SUPABASE_URL` unset — the app uses in-memory stubs automatically.

Leave `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` unset — rate limiting falls back to an ephemeral in-process store (same behaviour as before, sufficient for local dev).

Leave `RESEND_API_KEY` unset — emails (including admin OTP codes) are printed to the backend terminal as `[EMAIL STUB]` lines instead of being delivered.

---

## Step 2 — Start Servers

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev
# http://localhost:3000

# Terminal 2 — frontend (optional)
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## Step 3 — Seed Test Accounts

In-memory store starts empty. Run once after every restart:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Response:
```json
{
  "success": true,
  "accounts": [
    { "email": "admin@test.com", "password": "Admin1234!", "role": "ADMIN" },
    { "email": "member@test.com", "password": "Member1234!", "role": "MEMBER" }
  ]
}
```

Creates ACTIVE Monthly membership and 30 attendance points for the member account.

---

## Step 4 — Obtain a Session (Postman)

NextAuth uses httpOnly cookies. Postman handles them automatically.

### 4a. Get CSRF Token

```
GET http://localhost:3000/api/auth/csrf
```

```json
{ "csrfToken": "abc123..." }
```

### 4b. Sign In — Member (no OTP required)

```
POST http://localhost:3000/api/auth/callback/credentials
Body: x-www-form-urlencoded
```

| Key | Value |
|---|---|
| `email` | `member@test.com` |
| `password` | `Member1234!` |
| `csrfToken` | (from 4a) |
| `redirect` | `false` |
| `json` | `true` |

Postman stores `next-auth.session-token` automatically.

### 4b-admin. Sign In — Admin (two-step OTP)

Admin accounts require an email OTP as a second factor.

**Step 1 — request the code**

```
POST http://localhost:3000/api/auth/admin/send-otp
Body: JSON
{ "email": "admin@test.com", "password": "Admin1234!" }
```

→ `200 { "sent": true }`

Since `RESEND_API_KEY` is not set locally, the 6-digit code is printed to the **backend terminal**:

```
[EMAIL STUB] To: admin@test.com | Subject: FITP Admin Sign-In Code
```

The code also appears in the HTML body logged after it. Copy the 6 digits.

**Step 2 — sign in with OTP**

```
POST http://localhost:3000/api/auth/callback/credentials
Body: x-www-form-urlencoded
```

| Key | Value |
|---|---|
| `email` | `admin@test.com` |
| `password` | `Admin1234!` |
| `otp` | `<6-digit code from terminal>` |
| `csrfToken` | (from 4a — re-fetch if needed) |
| `redirect` | `false` |
| `json` | `true` |

→ 200, `next-auth.session-token` set with ADMIN role.

The OTP expires after **10 minutes** and can only be used once. Request a new code by repeating Step 1.

### 4c. Verify Session

```
GET http://localhost:3000/api/auth/session
```

```json
{
  "user": { "id": "...", "email": "admin@test.com", "role": "ADMIN" },
  "expires": "..."
}
```

---

## Step 5 — Test Endpoints

### Public (no auth)

```
GET  /api/staff
GET  /api/sponsors
GET  /api/events
GET  /api/events?all=true
POST /api/contact  { "firstName":"A","lastName":"B","email":"a@b.com","message":"Hi" }
```

### Member session

```
GET  /api/membership
GET  /api/attendance
POST /api/membership/cancel  {}
```

### Admin session — Members

```
GET    /api/admin/members
GET    /api/admin/members?status=ACTIVE
PATCH  /api/admin/members   { "id":"<uuid>", "name":"New Name" }
PATCH  /api/admin/members   { "id":"<uuid>", "revokeAccess": true }
DELETE /api/admin/members?id=<uuid>
```

### Admin session — Events

```
GET    /api/admin/events
POST   /api/admin/events   { "title":"Meeting","eventDate":"2026-05-01T18:00:00Z","pointsValue":1 }
PATCH  /api/admin/events   { "id":"<id>","pointsValue":2 }
DELETE /api/admin/events?id=<id>
```

### Admin session — Attendance

```
GET    /api/admin/attendance?userId=<uuid>
POST   /api/admin/attendance   { "userId":"<uuid>","date":"2026-04-09T18:00:00Z","eventName":"Meeting","points":1 }
PATCH  /api/admin/attendance   { "id":"<uuid>","points":3 }
DELETE /api/admin/attendance?id=<uuid>
```

### Auth error cases

```
GET  /api/membership      (no session) → 401
GET  /api/admin/members   (member session) → 403
```

---

## Step 6 — Forms Webhook (local)

```bash
# Matched user
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-forms-secret" \
  -d '{"email":"member@test.com","event_name":"Meeting","event_date":"2026-04-09T18:00:00Z"}'
# → { "success": true, "matched": true }

# Unmatched email — still 200 to prevent retry loops
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-forms-secret" \
  -d '{"email":"nobody@unknown.com","event_date":"2026-04-09T18:00:00Z"}'
# → { "success": true, "matched": false }

# Verify points incremented
GET /api/attendance  (with member session)
```

---

## Step 7 — Registration Flow

```bash
# With no email service configured, tokens are logged to the backend terminal.
# Look for: [EMAIL STUB] To: ... | Subject: Welcome

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"token":"<uuid-from-log>","name":"Alice Smith","password":"Password1!"}'
# → 200 { id, email, name, role }
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 401 on membership/attendance | Re-run signin (step 4b/4b-admin) — session expired |
| 403 on admin endpoints | Sign in as `admin@test.com` using the two-step OTP flow |
| 404 on membership | Re-run seed — server restarted, stubs reset |
| Login succeeds but no cookie | Body must be `x-www-form-urlencoded`, not JSON |
| `NEXTAUTH_SECRET` error | Verify `.env.local` exists with the value set |
| Forms webhook 500 | `FORMS_WEBHOOK_SECRET` not set in `.env.local` |
| Admin sign-in returns `OTP_REQUIRED` error | You submitted step 2 without an `otp` field — include the code from the terminal |
| Admin sign-in returns `OTP_INVALID` error | Code is wrong, expired (>10 min), or already used — request a new one via `POST /api/auth/admin/send-otp` |
| OTP code not visible in terminal | Ensure no `RESEND_API_KEY` is set; the stub logs to stdout, not a file |
| `send-otp` returns `429` | Rate limit hit (5 per 15 min per IP) — wait before retrying |
