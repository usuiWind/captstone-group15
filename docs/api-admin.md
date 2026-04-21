# API — Admin

All admin routes require `session.user.role === "ADMIN"`. Returns 401 if not authenticated, 403 if authenticated but not ADMIN.

---

## Members

### GET /api/admin/members

Returns all users merged with their membership data.

**Query params**

| Param | Values |
|---|---|
| `status` | `ACTIVE`, `PENDING`, `PAST_DUE`, `CANCELLED`, `EXPIRED` |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "alice@example.com",
      "name": "Alice Smith",
      "role": "MEMBER",
      "createdAt": "...",
      "membership": {
        "id": "42",
        "status": "ACTIVE",
        "planName": "Monthly",
        "currentPeriodStart": "...",
        "currentPeriodEnd": "...",
        "cancelAtPeriodEnd": false
      }
    }
  ]
}
```

`membership` is `null` for users who have never purchased a plan.

---

### PATCH /api/admin/members

Updates a member's role or revokes their access. Cannot update your own account.

**Request body**
```json
{ "id": "uuid", "role": "ADMIN" }
{ "id": "uuid", "revokeAccess": true }
{ "id": "uuid", "name": "New Name" }
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Required |
| `name` | string | Optional |
| `role` | `"MEMBER"` or `"ADMIN"` | Optional |
| `revokeAccess` | boolean | Cancels Stripe subscription immediately, sets membership CANCELLED |

**Responses**

| Status | Meaning |
|---|---|
| 200 | `{ success: true, data: { user, membership } }` |
| 400 | Validation failed |
| 403 | Not ADMIN, or attempting to update own account |
| 404 | User not found |

---

### DELETE /api/admin/members?id=\<uuid\>

Permanently deletes a member. Cannot delete your own account. Cancels Stripe subscription first.

**Responses**

| Status | Meaning |
|---|---|
| 200 | `{ success: true }` |
| 400 | Invalid ID |
| 403 | Not ADMIN, or attempting to delete own account |

---

## Events

### GET /api/admin/events

Returns all events ordered by date ascending (includes past events).

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
      "createdBy": "uuid",
      "createdAt": "..."
    }
  ]
}
```

---

### POST /api/admin/events

Creates a new event.

**Request body**
```json
{
  "title": "Weekly Meeting — Week 5",
  "description": "Room 204B",
  "eventDate": "2026-04-16T18:00:00Z",
  "pointsValue": 1
}
```

| Field | Type | Required |
|---|---|---|
| `title` | string max 200 | Yes |
| `description` | string max 2000 | No |
| `eventDate` | ISO datetime | Yes |
| `pointsValue` | integer 0–100 | Yes |

**Response 201** — `{ "data": { ...event } }`

---

### PATCH /api/admin/events

Updates an existing event.

**Request body** — any subset of fields plus required `id`:
```json
{ "id": "1", "pointsValue": 2 }
```

**Response 200** — `{ "data": { ...updatedEvent } }`

---

### DELETE /api/admin/events?id=\<id\>

Deletes an event. Attendance rows that referenced this event have their `event_id` set to NULL (`ON DELETE SET NULL`).

**Response 200** — `{ "success": true }`

---

## Attendance

### GET /api/admin/attendance?userId=\<uuid\>

Returns a member's attendance records and point total. `userId` must be a valid UUID.

**Response 200**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "userId": "uuid",
        "date": "2026-04-09T18:00:00.000Z",
        "eventName": "Weekly Meeting",
        "points": 1,
        "createdAt": "..."
      }
    ],
    "totalPoints": 12
  }
}
```

---

### POST /api/admin/attendance

Creates an attendance record for a member. Also creates a `point_transactions` row.

**Request body**
```json
{
  "userId": "uuid",
  "date": "2026-04-09T18:00:00Z",
  "eventName": "Weekly Meeting",
  "points": 1
}
```

| Field | Type | Required |
|---|---|---|
| `userId` | UUID | Yes |
| `date` | ISO datetime | Yes |
| `eventName` | string max 200 | No |
| `points` | integer 0–100 | Yes |

If `eventName` matches a row in the `events` table (case-insensitive), `events.points_value` is used as the canonical point value.

---

### PATCH /api/admin/attendance

Updates an existing attendance record. Updating `points` also updates the linked `point_transactions` row.

**Request body**
```json
{ "id": "uuid", "points": 2 }
{ "id": "uuid", "eventName": "Renamed Event", "date": "2026-04-10T18:00:00Z" }
```

| Field | Type | Required |
|---|---|---|
| `id` | UUID | Yes |
| `points` | integer 0–100 | No |
| `eventName` | string max 200 | No |
| `date` | ISO datetime | No |

**Response 200** — `{ "success": true, "data": { ...updatedRecord } }`

---

### DELETE /api/admin/attendance?id=\<uuid\>

Deletes the attendance record and its associated `point_transactions` rows.

**Response 200** — `{ "success": true }`

---

## Staff

### POST /api/admin/staff

Creates a staff member. Accepts `multipart/form-data`.

| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `role` | string | Yes |
| `order` | number | Yes |
| `bio` | string | No |
| `email` | string | No |
| `isActive` | `"true"` / `"false"` | No (default `false`) |
| `image` | File | No — uploaded to Vercel Blob |

### PUT /api/admin/staff

Updates a staff member. Same fields as POST, plus required `id`. Only supplied fields are updated.

### DELETE /api/admin/staff?id=\<id\>

Soft-deletes a staff member (`isActive = false`).

---

## Sponsors

### POST / PUT / DELETE /api/admin/sponsors

Same pattern as staff. Additional fields: `tier` (`PLATINUM`, `GOLD`, `SILVER`, `BRONZE`), `websiteUrl`, `startDate`, `endDate`.

---

## Notes

- Image uploads require `BLOB_READ_WRITE_TOKEN`. Without it, `imageUrl` will be empty.
- `points` authority is `point_transactions.points`, not `events.points_value`. The event value is the default at creation; subsequent admin edits update the transaction directly.
