# API — Admin

All admin routes require `session.user.role === "ADMIN"` (403 otherwise).

---

## GET /api/admin/members

Returns all users merged with their membership data.

**Query params**
| Param | Values | Effect |
|-------|--------|--------|
| `status` | `ACTIVE`, `PENDING`, `PAST_DUE`, `CANCELLED`, `EXPIRED` | Filter by membership status |

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
        "cancelAtPeriodEnd": false,
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
  ]
}
```

`membership` is `null` for users who have never purchased a plan.

---

## POST /api/admin/staff

Creates a staff member. Accepts `multipart/form-data`.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `role` | string | yes |
| `order` | number | yes |
| `bio` | string | no |
| `email` | string | no |
| `isActive` | `"true"/"false"` | no (default `false`) |
| `image` | File | no — uploaded to Vercel Blob |

## PUT /api/admin/staff

Updates a staff member. Same form fields as POST, plus required `id`.
Only supplied fields are updated.

## DELETE /api/admin/staff?id=\<id\>

Soft-deletes a staff member (`isActive = false`).

---

## POST /api/admin/sponsors
## PUT /api/admin/sponsors
## DELETE /api/admin/sponsors?id=\<id\>

Same pattern as staff. Sponsor-specific fields: `name`, `tier`, `website`,
`logoUrl`, `isActive`, `image` (File, uploaded to Vercel Blob).

---

## POST /api/admin/attendance

See `api-attendance.md`.

---

## Notes

- Staff and sponsor data is managed in Supabase stub repositories (in-memory).
  To persist across restarts, wire them to Supabase tables.
- Image uploads require `BLOB_READ_WRITE_TOKEN` in `.env.local`. Without it,
  image fields are ignored and `imageUrl` will be empty.
