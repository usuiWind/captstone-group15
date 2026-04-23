# Points System

Points are earned by members when they attend events. They are stored in Supabase and surfaced on the Member Dashboard.

---

## Database Tables

Points live across three tables. The `point_transactions` table is the authoritative ledger — points are never cached on the user profile.

### `events`
Defines reusable events and their default point value.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | Primary key |
| `title` | TEXT | Event name, used for case-insensitive matching in the forms webhook |
| `event_date` | DATE | |
| `points_value` | INTEGER | Default points awarded for attendance; default `1` |

### `attendance`
One row per member per event check-in.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK → `auth.users` |
| `event_id` | INTEGER | FK → `events` (SET NULL on delete) |
| `check_in_time` | TIMESTAMPTZ | |

### `point_transactions`
One row per attendance record. This is where the actual point value lives.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK → `auth.users` |
| `event_id` | INTEGER | FK → `events` (nullable) |
| `attendance_id` | INTEGER | FK → `attendance` **ON DELETE CASCADE** |
| `points` | INTEGER | Points awarded for this check-in |
| `reason` | TEXT | Event name or custom label |

The `ON DELETE CASCADE` on `attendance_id` ensures that deleting an attendance record automatically deletes its point transaction. No orphaned points are possible.

---

## How Points Are Created

Every call to `POST /api/admin/attendance` creates both rows atomically:

```
attendanceRepository.create(data)
  1. Look up event by name → get event_id and points_value
  2. INSERT INTO attendance (user_id, event_id, check_in_time)
  3. INSERT INTO point_transactions (user_id, event_id, attendance_id, points, reason)
```

The `points` value on the request body overrides the event default. If no event match is found, the submitted `points` value is used directly and `reason` is set to the provided event name.

**Source:** `backend/lib/repositories/supabase/attendanceRepository.ts`, lines 54–96

---

## How Points Are Adjusted

Admins can update the point value for an existing attendance record:

```
PATCH /api/admin/attendance { id, points }
  → UPDATE point_transactions SET points = ? WHERE attendance_id = ?
```

Only `point_transactions.points` is updated — the `attendance` row is unchanged. The change is reflected immediately on the member's dashboard on next load.

**Source:** `attendanceRepository.ts`, lines 98–123

---

## How Points Are Deleted

Deleting an attendance record cascades to its point transaction automatically:

```
DELETE /api/admin/attendance?id=<uuid>
  → DELETE FROM point_transactions WHERE attendance_id = ?   (explicit, handles pre-cascade rows)
  → DELETE FROM attendance WHERE id = ?
```

The explicit delete in step 1 is a compatibility guard for records created before the `attendance_id` FK was added.

**Source:** `attendanceRepository.ts`, lines 125–131

---

## How Total Points Are Computed

There is no `total_points` column on the user profile. The total is always computed on demand:

```sql
SELECT COALESCE(SUM(points), 0)
FROM point_transactions
WHERE user_id = ?
```

This query runs in two places:
- `GET /api/attendance` — member fetching their own total
- `GET /api/admin/members` — admin listing all members (runs once per member row)

**Source:** `attendanceRepository.ts`, lines 44–52

---

## Point Sources

| Source | Mechanism | Who triggers |
|---|---|---|
| Admin records attendance | `POST /api/admin/attendance` | Admin |
| Admin adjusts points | `PATCH /api/admin/attendance { id, points }` | Admin |
| Google / Microsoft Forms check-in | `POST /api/webhooks/forms` | Automated webhook |

### Forms Webhook Point Resolution

When a form submission arrives at `/api/webhooks/forms`:

1. Webhook secret verified via `crypto.timingSafeEqual` (timing-safe).
2. Payload validated — `event_date` rejected if in the future or >30 days past.
3. Submitter email resolved to a user UUID via `repositories.user.findByEmail`.
4. If `event_name` matches a row in `events` (case-insensitive), the `events.points_value` is used as the canonical point amount.
5. If no event match, falls back to the submitted `points` field, then to the `FORMS_DEFAULT_POINTS` env var (default: `1`).
6. Unmatched emails (no user found) are stored in `unmatched_form_submissions` for admin review.

---

## Member Dashboard Display

The Member Dashboard (`frontend/src/pages/MemberDashboard.jsx`) fetches points on mount:

```
useEffect
  → getAttendance()                    (GET /api/attendance)
  → response: { records, totalPoints }
  → setBackendPoints(totalPoints)
```

`backendPoints` takes precedence over any cached member data:

```js
// MemberDashboard.jsx line 334
const totalPoints = backendPoints !== null ? backendPoints : member.totalPoints
```

Points are displayed in four places:
- **Points badge** — `{totalPoints}` with a "Goal: 100" label (line 395–399)
- **Stats card** — total points and goal (line 464–466)
- **Progress bar** — `Math.min(100, Math.round((totalPoints / member.pointsGoal) * 100))` (line 336)
- **Recent events list** — up to 4 most recent attendance records with individual point amounts (line 539–576)
- **Full events tab** — all attendance records sorted by date with per-event points (line 678–720)

### Points Goal

The points goal is currently hardcoded to `100` in the frontend mock data. It is **not** stored in the database or returned by any API endpoint. If per-member or configurable goals are needed, a `points_goal` column on `profiles` or a site-wide setting would be required.

---

## End-to-End Flow

```
Admin records attendance
  ↓
POST /api/admin/attendance
  { userId, date, eventName, points }
  ↓
attendanceRepository.create()
  → INSERT attendance row
  → INSERT point_transactions row (points, reason = eventName)
  ↓
Member loads dashboard
  ↓
GET /api/attendance   (authenticated — current user only)
  ↓
attendanceService.getUserAttendance(userId)
  → findByUserId()      → attendance rows joined to point_transactions
  → getTotalPoints()    → SUM(point_transactions.points)
  ↓
{ records: Attendance[], totalPoints: number }
  ↓
MemberDashboard renders:
  - Progress bar (totalPoints / 100)
  - Points badge
  - Per-event point amounts in event lists
```

---

## Key Design Decisions

- **No denormalization.** The `profiles` table has no `points` column. Points are always summed live from `point_transactions`. This prevents stale cached totals after admin edits or deletions.
- **Cascade safety.** The `attendance_id FK ON DELETE CASCADE` makes attendance deletion atomic — removing an attendance row always removes its points.
- **Event default is non-binding.** `events.points_value` is only a default for new attendance records. Editing it after the fact does not retroactively change existing `point_transactions`.
- **Flexible point override.** Admins can set any point value per attendance record, independent of the event's default.
