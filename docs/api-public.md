# API — Public Endpoints

No authentication required.

---

## GET /api/staff

Returns all active staff members ordered by `order` field.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Bob Jones",
      "role": "President",
      "bio": "...",
      "email": "bob@example.com",
      "imageUrl": "https://...",
      "order": 1,
      "isActive": true
    }
  ]
}
```

---

## GET /api/sponsors

Returns all active sponsors.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "tier": "Gold",
      "logoUrl": "https://...",
      "website": "https://acme.com",
      "isActive": true
    }
  ]
}
```

---

## POST /api/contact

Submits a contact form inquiry. Rate limited: 100 req / 15 min per IP.

**Request body**
```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "message": "Hello..."
}
```

All four fields are required (400 if any are missing).

**Responses**
| Status | Meaning |
|--------|---------|
| 200 | `{ "success": true }` — message logged (email not yet sent) |
| 400 | Missing required fields |
| 429 | Rate limit exceeded |
| 500 | Server error |

**Note**: The contact handler currently only logs to the console. To send
an email, add a `emailService.sendContactNotification()` call in
`backend/app/api/contact/route.ts` and implement the method in `lib/email.ts`.

---

## Admin mutations for staff and sponsors

`POST/PUT/DELETE /api/admin/staff` and `/api/admin/sponsors` require ADMIN role.
See `api-admin.md` for details.
