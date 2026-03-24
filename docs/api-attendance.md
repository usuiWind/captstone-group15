# API — Attendance

---

## GET /api/attendance

Returns the calling user's attendance records and total points.
Requires authentication (401 if missing).

**Response 200**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "userId": "uuid",
        "date": "2026-03-15T00:00:00.000Z",
        "eventName": "Weekly Meeting",
        "points": 10,
        "createdAt": "..."
      }
    ],
    "totalPoints": 10
  }
}
```

---

## POST /api/admin/attendance

Creates an attendance record for any user. Admin only (403 if not ADMIN).

**Request body**
```json
{
  "userId": "uuid",
  "date": "2026-03-15",
  "eventName": "Weekly Meeting",
  "points": 10
}
```

| Field | Type | Required |
|-------|------|----------|
| `userId` | string | yes |
| `date` | ISO date string | yes |
| `points` | number ≥ 0 | yes |
| `eventName` | string | no |

**Responses**
| Status | Meaning |
|--------|---------|
| 200 | Record created; returns the new attendance object |
| 400 | Missing required fields or invalid points value |
| 403 | Not an admin |
| 401 | Not authenticated |

---

## Notes

- There is no delete endpoint yet. To remove a record, use Supabase dashboard or
  add a `DELETE /api/admin/attendance?id=<id>` route.
- The `points` field is validated `>= 0` on the backend. The frontend caps it at
  100, but the backend has no upper bound — add a max check if needed.
- `totalPoints` is computed by `SUM(points)` in the attendance repository.
