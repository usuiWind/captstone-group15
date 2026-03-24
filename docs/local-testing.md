# Local Testing Guide

No database or Stripe account required. Everything runs in-memory.

---

## Step 1 — Environment

Create `backend/.env.local` with just these two values:

```env
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

Leave `SUPABASE_URL` unset. The app will use in-memory stubs automatically.

---

## Step 2 — Start Servers

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev
# Running on http://localhost:3000

# Terminal 2 — frontend (optional, not needed for API testing)
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Step 3 — Seed Test Accounts

The in-memory store starts empty. Run the seed endpoint once after every restart:

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
  ],
  "note": "Data is in-memory and resets on server restart."
}
```

This also creates an ACTIVE Monthly membership and 30 attendance points for the member account.

---

## Step 4 — Get a Session (Postman)

NextAuth uses httpOnly cookies. Postman handles them automatically if you follow these steps.

### 4a. Get CSRF Token

```
GET http://localhost:3000/api/auth/csrf
```

Response:
```json
{ "csrfToken": "abc123..." }
```

### 4b. Sign In

```
POST http://localhost:3000/api/auth/callback/credentials
```

**Body → x-www-form-urlencoded** (not JSON):

| Key | Value |
|-----|-------|
| `email` | `member@test.com` |
| `password` | `Member1234!` |
| `csrfToken` | *(paste from step 4a)* |
| `redirect` | `false` |
| `json` | `true` |

Postman will store the `next-auth.session-token` cookie automatically.
All subsequent requests in the same collection will send it.

To sign in as admin, repeat with `admin@test.com` / `Admin1234!`.

### 4c. Verify Session

```
GET http://localhost:3000/api/auth/session
```

Expected:
```json
{
  "user": { "name": "Test Member", "email": "member@test.com", "role": "MEMBER", "id": "..." },
  "expires": "..."
}
```

---

## Step 5 — Test Endpoints

### Member endpoints (sign in as member first)

```
GET  http://localhost:3000/api/membership
GET  http://localhost:3000/api/attendance
POST http://localhost:3000/api/membership/cancel
```

### Admin endpoints (sign in as admin first)

```
GET  http://localhost:3000/api/admin/members
GET  http://localhost:3000/api/admin/members?status=ACTIVE

POST http://localhost:3000/api/admin/attendance
Body (JSON):
{
  "userId": "<member-id-from-admin/members>",
  "date": "2026-03-20",
  "eventName": "Test Event",
  "points": 15
}
```

### Public endpoints (no auth needed)

```
GET  http://localhost:3000/api/staff
GET  http://localhost:3000/api/sponsors

POST http://localhost:3000/api/contact
Body (JSON):
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "message": "Test message"
}
```

### Auth error cases (confirm correct status codes)

```
GET  http://localhost:3000/api/membership        → 401 (no session)
GET  http://localhost:3000/api/admin/members     → 403 (member session, not admin)
POST http://localhost:3000/api/admin/attendance  → 403 (member session, not admin)
```

---

## Step 6 — Registration Flow (manual)

```bash
# 1. Create a pending user and get a token
curl -X POST http://localhost:3000/api/dev/seed

# 2. In the backend terminal, watch for the token logged when checkout.session.completed fires.
#    In stub mode you can create one manually:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"token":"bad-token","name":"Alice","password":"pass1234"}'
# → 400 (expected — token doesn't exist)

# To get a real token: trigger a Stripe test webhook (see api-webhooks.md)
# The token will appear in the backend terminal as:
# [EMAIL STUB] To: ... | Subject: Welcome — complete your registration
```

---

## Postman Collection Setup (recommended)

1. Create a collection variable `baseUrl = http://localhost:3000`
2. Add a **Pre-request Script** on the collection level (runs before every request):
   - Nothing needed — Postman's cookie jar handles the session automatically.
3. Create a folder "Auth" with the CSRF + signin requests.
4. Create folders "Member", "Admin", "Public" with the endpoint requests above.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `401` on membership/attendance | Re-run the signin request (step 4b); session may have expired |
| `403` on admin endpoints | Sign in as `admin@test.com`, not member |
| Membership returns 404 | Re-run seed — server was restarted, stubs reset |
| Login fails with 200 but no cookie | Ensure body is `x-www-form-urlencoded`, not JSON |
| `NEXTAUTH_SECRET` error | Check `.env.local` exists with the value set |
