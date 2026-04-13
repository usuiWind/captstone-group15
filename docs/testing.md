# Testing Guide

## Prerequisites

- Node.js 22.12+
- Both dev servers running (see local-testing.md for full setup)
- No Supabase or Stripe account needed for smoke tests

---

## 1. Start Dev Servers

```bash
# Terminal 1
cd backend && npm run dev    # http://localhost:3000

# Terminal 2
cd frontend && npm run dev   # http://localhost:5173
```

---

## 2. Seed Test Accounts

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Creates admin (`admin@test.com` / `Admin1234!`) and member (`member@test.com` / `Member1234!`) with ACTIVE membership and 30 attendance points. Data resets on server restart.

---

## 3. Smoke Test — Public Endpoints

```bash
curl http://localhost:3000/api/staff
curl http://localhost:3000/api/sponsors
curl http://localhost:3000/api/events
curl "http://localhost:3000/api/events?all=true"

# Contact form — valid
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith","email":"a@b.com","message":"Hi"}'
# → 200

# Contact form — missing field
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice"}'
# → 400
```

---

## 4. Smoke Test — Auth Guards

```bash
# No session → 401
curl http://localhost:3000/api/membership
curl http://localhost:3000/api/attendance

# No session → 401/403
curl http://localhost:3000/api/admin/members
curl http://localhost:3000/api/admin/events
curl http://localhost:3000/api/admin/attendance?userId=00000000-0000-0000-0000-000000000000
```

---

## 5. Admin Endpoints (Postman, with admin session)

See `local-testing.md` steps 4a–4b to obtain an admin session cookie.

### Events CRUD

```
POST /api/admin/events
Body: { "title": "Test Meeting", "eventDate": "2026-05-01T18:00:00Z", "pointsValue": 1 }
→ 201 with event object, note the returned "id"

PATCH /api/admin/events
Body: { "id": "<id>", "pointsValue": 2 }
→ 200

GET /api/admin/events
→ 200, events list includes the created event

DELETE /api/admin/events?id=<id>
→ 200
```

### Member Management

```
GET /api/admin/members
→ 200, array of users with membership

GET /api/admin/members?status=ACTIVE
→ filtered list

PATCH /api/admin/members
Body: { "id": "<member-uuid>", "name": "Updated Name" }
→ 200

PATCH /api/admin/members
Body: { "id": "<member-uuid>", "revokeAccess": true }
→ 200, membership status → CANCELLED

# Self-update guard
PATCH /api/admin/members
Body: { "id": "<admin-uuid>", "role": "MEMBER" }
→ 403
```

### Attendance CRUD

```
POST /api/admin/attendance
Body: { "userId": "<member-uuid>", "date": "2026-04-09T18:00:00Z", "eventName": "Test Event", "points": 2 }
→ 200, note the returned "id"

GET /api/admin/attendance?userId=<member-uuid>
→ 200, records list, totalPoints updated

PATCH /api/admin/attendance
Body: { "id": "<attendance-id>", "points": 5 }
→ 200, points updated

GET /api/admin/attendance?userId=<member-uuid>
→ totalPoints reflects the change

DELETE /api/admin/attendance?id=<attendance-id>
→ 200

GET /api/admin/attendance?userId=<member-uuid>
→ record gone, totalPoints reduced
```

---

## 6. Forms Webhook

Set `FORMS_WEBHOOK_SECRET=test-secret` in `backend/.env.local`, then restart.

```bash
# Valid submission — matched user
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret" \
  -d '{"email":"member@test.com","event_name":"Test Meeting","event_date":"2026-04-09T18:00:00Z"}'
# → 200 { "success": true, "matched": true }

# Valid submission — unknown email
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret" \
  -d '{"email":"nobody@unknown.com","event_name":"Test Meeting","event_date":"2026-04-09T18:00:00Z"}'
# → 200 { "success": true, "matched": false }

# Wrong secret → 401
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong" \
  -d '{"email":"member@test.com","event_date":"2026-04-09T18:00:00Z"}'

# Future date → 400
curl -X POST http://localhost:3000/api/webhooks/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret" \
  -d '{"email":"member@test.com","event_date":"2030-01-01T00:00:00Z"}'

# Verify attendance was created
# In Postman with member session:
GET /api/attendance
# → totalPoints increased by FORMS_DEFAULT_POINTS (default 1)
```

---

## 7. Stripe Webhook

Requires Stripe CLI and test keys in `.env.local`.

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe

stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

Verify state changes via `GET /api/admin/members` in Postman.

---

## 8. Registration Flow

```bash
# Trigger the full flow via Stripe CLI (see step 7)
# Watch backend terminal for the logged registration email link
# Copy the token and complete registration:

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"token":"<uuid-from-log>","name":"Alice Smith","password":"Password1!"}'
# → 200 { id, email, name, role }

# Invalid token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"token":"00000000-0000-0000-0000-000000000000","name":"Alice","password":"Password1!"}'
# → 400
```

---

## 9. Build Check

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Both should produce zero TypeScript / build errors. If build errors appear in `membershipService.ts`, `stripe.ts`, or `validation.ts`, these indicate a Stripe API version or Zod v4 regression — check `next-steps.md`.

---

## 10. Access Control (browser)

| URL | Session | Expected |
|---|---|---|
| `/dashboard` | Logged out | Redirect to `/login` |
| `/admin` | Logged in as MEMBER | Redirect to `/dashboard` |
| `/admin` | Logged in as ADMIN | Admin dashboard renders |
| `/register?token=bad` | Any | 400 error shown |
