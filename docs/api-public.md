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

Returns all active sponsors (where `is_active = true` and `end_date >= today`).

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "tier": "GOLD",
      "logoUrl": "https://...",
      "websiteUrl": "https://acme.com",
      "isActive": true
    }
  ]
}
```

---

## GET /api/events

Returns upcoming events (today or later) by default. Pass `?all=true` to include past events.

**Query params**

| Param | Effect |
|---|---|
| `all=true` | Returns all events, past and future |

**Response 200**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Weekly Meeting — Week 5",
      "description": "Room 204B",
      "eventDate": "2026-04-16T00:00:00.000Z",
      "pointsValue": 1,
      "createdAt": "..."
    }
  ]
}
```

---

## POST /api/contact

Submits a contact form inquiry. Rate limited: 10 req / hour per IP.

**Request body**
```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "message": "Hello..."
}
```

All four fields required (400 if missing).

**Responses**

| Status | Meaning |
|---|---|
| 200 | `{ "success": true }` — submission logged |
| 400 | Missing or invalid fields |
| 429 | Rate limit exceeded |

Note: contact submissions are currently logged to console only. Email notification is not yet wired (see `docs/architecture.md` Security Gaps).
