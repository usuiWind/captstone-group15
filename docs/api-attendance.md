# API — Attendance

---

## GET /api/attendance

Returns the calling user's attendance records and point total. Requires authentication (401 if missing).

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

`totalPoints` is the authoritative sum of all `point_transactions.points` for the user — not a sum of the attendance `points` field.

---

## Admin endpoints

See `api-admin.md` for:

- `GET /api/admin/attendance?userId=<uuid>` — fetch any member's records
- `POST /api/admin/attendance` — create a record
- `PATCH /api/admin/attendance` — update points, event name, or date
- `DELETE /api/admin/attendance?id=<uuid>` — delete a record (cascades to point_transactions)

---

## Points data model

Each `POST /api/admin/attendance` creates two rows:

```
attendance (id, user_id, event_id, check_in_time)
     └─ point_transactions (attendance_id FK CASCADE, user_id, points, reason)
```

Deleting the `attendance` row triggers a cascade delete on `point_transactions`. `PATCH` with a new `points` value updates `point_transactions.points` directly.

The `points` value returned on each attendance record comes from `point_transactions.points`, not from the linked event. Admin edits to points take effect immediately.
