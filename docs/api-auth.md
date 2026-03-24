# API — Authentication

Base URL: `http://localhost:3000`

All responses follow `{ success: boolean, data?: ..., error?: string }`.

---

## POST /api/auth/register

Completes registration for a user who arrived via the welcome email link.
Consumes the token (single-use). Rate limited: 5 req / 15 min per IP.

**Request body**
```json
{ "token": "uuid", "name": "Alice Smith", "password": "min8chars" }
```

**Responses**
| Status | Meaning |
|--------|---------|
| 200 | Account activated; returns `{ id, email, name, role }` |
| 400 | Validation failed or token invalid/expired |
| 429 | Rate limit exceeded |

Security headers (`X-Frame-Options`, `CSP`, etc.) are added to every response.

---

## POST /api/auth/signin  *(NextAuth)*

Standard NextAuth credentials flow.

**Request body**
```json
{ "email": "alice@example.com", "password": "...", "csrfToken": "..." }
```

Returns a session cookie. On success, the JWT payload contains `{ id, email, role }`.

---

## GET /api/auth/session  *(NextAuth)*

Returns the current session or `null`.

```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "MEMBER" },
  "expires": "2026-04-24T..."
}
```

---

## GET/POST /api/auth/[...nextauth]

Catch-all NextAuth handler. Includes CSRF, callback, and provider routes.
Do not call these directly — use the NextAuth client library.

---

## Notes

- Passwords are hashed with `bcryptjs` before storage.
- The registration token expires after 24 hours and is deleted on use.
- `NEXTAUTH_SECRET` must be set in production; generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
