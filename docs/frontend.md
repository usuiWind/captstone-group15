# Frontend

React 18 + Vite + React Router v6. Located in `frontend/`.

---

## Directory Structure

```
frontend/
  src/
    api/services/
      adminService.js       Admin CRUD — events, members, attendance
      attendanceService.js  getMyAttendance
      authService.js        login, logout, getSession
      contactService.js     submitContactForm
      membershipService.js  getMembership, cancelMembership
      sponsorsService.js    getSponsors
    components/
      Navbar.jsx            Top navigation bar
      ProtectedRoute.jsx    Redirects to /login if no session
    context/
      AuthContext.jsx       Global auth state provider
    pages/
      AdminPage.jsx         Admin dashboard — Members / Attendance / Events / Analytics tabs
      ContactPage.jsx       Contact form
      DashboardPage.jsx     Member dashboard — membership status, attendance summary
      LoginPage.jsx         Email + password sign-in
      MembershipPage.jsx    Membership info and cancel flow
      RegisterPage.jsx      Token-based registration (arrival from welcome email)
      SponsorshipsPage.jsx  Public sponsor display
  App.jsx                   React Router route definitions
  backend.js                Shared fetch helpers
```

---

## Routing (App.jsx)

| Path | Component | Guard |
|---|---|---|
| `/` | Home / Landing | None |
| `/login` | LoginPage | None |
| `/register` | RegisterPage | None |
| `/member-register-form` | RegisterPage (alias) | None |
| `/dashboard` | DashboardPage | ProtectedRoute (any auth) |
| `/membership` | MembershipPage | ProtectedRoute (any auth) |
| `/admin` | AdminPage | ProtectedRoute (ADMIN only) |
| `/contact` | ContactPage | None |
| `/sponsorships` | SponsorshipsPage | None |

`ProtectedRoute` checks `AuthContext`. Admin-only pages additionally check `user.role === "ADMIN"` and redirect to `/dashboard` if not.

---

## Auth Context (AuthContext.jsx)

Provides `{ user, loading, login, logout }` to the whole tree.

- `user` — `{ id, email, name, role }` or `null`
- `loading` — `true` while session is being fetched on mount
- `login(email, password)` — calls NextAuth credentials endpoint, then refreshes session
- `logout()` — calls NextAuth signout

The context fetches `GET /api/auth/session` on mount and after every login. Components should check `loading` before rendering protected content to avoid redirect flicker.

---

## backend.js — Fetch Helpers

All API calls go through these helpers. They prepend `VITE_API_URL` and include credentials (cookies).

```js
getJson(path)              // GET
postJson(path, body)       // POST with JSON body
patchJson(path, body)      // PATCH with JSON body
deleteJson(path)           // DELETE (no body)
```

All four throw on non-2xx responses with `error.message` set to the server's `error` field (or the HTTP status text as fallback).

---

## Service Layer

### adminService.js

| Function | Method | Path |
|---|---|---|
| `getAllEvents()` | GET | `/api/admin/events` |
| `createEvent({ title, description, eventDate, pointsValue })` | POST | `/api/admin/events` |
| `updateEvent({ id, ...fields })` | PATCH | `/api/admin/events` |
| `deleteEvent(id)` | DELETE | `/api/admin/events?id=` |
| `getAllMembers(status?)` | GET | `/api/admin/members` |
| `updateMember({ id, name?, role?, revokeAccess? })` | PATCH | `/api/admin/members` |
| `deleteMember(id)` | DELETE | `/api/admin/members?id=` |
| `getMemberAttendance(userId)` | GET | `/api/admin/attendance?userId=` |
| `recordAttendance({ userId, date, eventName, points })` | POST | `/api/admin/attendance` |
| `updateAttendance({ id, points?, eventName?, date? })` | PATCH | `/api/admin/attendance` |
| `deleteAttendance(id)` | DELETE | `/api/admin/attendance?id=` |

### membershipService.js

| Function | Method | Path |
|---|---|---|
| `getMembership()` | GET | `/api/membership` |
| `cancelMembership()` | POST | `/api/membership/cancel` |

### attendanceService.js

| Function | Method | Path |
|---|---|---|
| `getMyAttendance()` | GET | `/api/attendance` |

---

## Admin Page (AdminPage.jsx)

Four tabs rendered from `TABS` array. All share the `members` array loaded at mount by `getAllMembers()`.

### Members tab
- Search/filter by name or email
- Per-row: Revoke (cancels Stripe, orange) and Delete (confirms inline, red)
- Revoke only shown for ACTIVE or PAST_DUE memberships
- `onRefresh` callback re-fetches members after any mutation

### Attendance tab
- Left column: create form — select member, event name, date, points
- Right column: selected member's records with inline point editing and row deletion
- Creating a record or deleting one refreshes the records list automatically

### Events tab
- Left column: create / edit form — title, description (optional), date, points value
- Right column: Upcoming section and Past section (last 10), each with Edit and Delete buttons
- Clicking Edit fills the form and switches the submit button to "Update Event"

### Analytics tab
- Summary cards: total members, active, past due, no membership, expiring within 14 days
- Expiring members list sorted by days remaining

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL — e.g. `http://localhost:3000` in dev, `https://api.example.com` in prod |

---

## Building

```bash
cd frontend
npm install
npm run build   # outputs to dist/
```

The build output in `dist/` is a static SPA. Any CDN or static host works (Vercel, Netlify, S3 + CloudFront).

Because the frontend is an SPA with client-side routing, the host must serve `index.html` for all non-asset paths. On Vercel this is automatic. On Nginx, add `try_files $uri /index.html`.
