# Authentication & Security Report

## Overview

This report covers how users authenticate, how sessions are managed, how the registration flow works, and what security controls are in place across the application.

---

## Authentication Strategy: NextAuth v5 with JWT Sessions

The application uses **NextAuth v5** (also known as Auth.js) for session management. NextAuth abstracts the complexity of credential validation, session creation, and CSRF protection into a library that integrates directly with the Next.js App Router.

### Why NextAuth

The alternative to using NextAuth would be to implement session management manually: generate tokens, store them server-side or in cookies, validate them on each request, handle CSRF, and manage expiry. NextAuth handles all of this. The team's responsibility is limited to:

1. Defining how credentials are validated (the `authorize` callback)
2. Specifying what goes into the JWT (`id`, `email`, `role`)
3. Configuring the secret used to sign tokens

### JWT Payload

After a successful sign-in, NextAuth creates a signed JWT containing:

```json
{ "id": "uuid", "email": "user@example.com", "role": "MEMBER" }
```

The `role` field is the key addition beyond NextAuth's defaults. Every protected route handler calls `auth()` to retrieve the session and reads `session.user.role` to determine access level. There are two roles: `MEMBER` and `ADMIN`.

### Why Stateless JWT Over Server-Side Sessions

A server-side session store (Redis, database table) requires infrastructure and adds a network call to every authenticated request. A JWT is verified cryptographically using `NEXTAUTH_SECRET` — no database lookup needed. The tradeoff is that JWTs cannot be individually revoked before they expire. For a club membership application with low-risk data, this is an acceptable tradeoff.

---

## Registration Flow

User accounts are not created through a self-serve sign-up form. Instead, accounts are provisioned automatically when a user completes a Stripe payment. This design prevents free account creation and ties every account to a paid membership.

The flow is:

```
1. User completes Stripe Checkout
2. Webhook fires → User record created (status: PENDING)
3. Single-use token (UUID) generated, stored with 24-hour expiry
4. Welcome email sent: {APP_URL}/register?token=<uuid>
5. User clicks link → POST /api/auth/register
6. Token validated: must exist and not be expired
7. User sets their name and password
8. Token deleted (single-use enforced)
9. Account activated
```

### Why Token-Based Registration

The single-use token approach solves several problems simultaneously:

- **Email verification is implicit.** A user can only complete registration if they receive the email, which proves the address is valid and reachable.
- **Account creation is gated behind payment.** There is no path to create an account without first completing a Stripe checkout.
- **No password is stored at checkout time.** The user's password is set only after they click the link, keeping the PENDING state lightweight.

### Password Storage

Passwords are hashed using `bcryptjs` before storage. bcrypt is specifically designed for password hashing: it is intentionally slow (configurable work factor), incorporates a random salt, and produces output that is safe to store. Using a general-purpose hash like SHA-256 for passwords would be a security vulnerability; bcrypt is the correct tool.

---

## Route Protection

Protection is enforced at two levels:

### 1. Middleware (`middleware.ts`)

Next.js middleware runs before any route handler. The middleware intercepts all requests to `/api/membership` and `/api/attendance` and rejects unauthenticated requests with 401 before the handler is reached. This is a coarse but efficient first gate.

### 2. Route Handler Checks

Within individual handlers, fine-grained access control is applied:

- **Any authenticated user:** `auth()` must return a session
- **Admin-only routes:** `session.user.role === 'ADMIN'` is checked explicitly; non-admins receive 403

This defense-in-depth means that even if middleware were misconfigured, admin routes would still reject non-admin users.

---

## Security Headers

Every API response is decorated with security headers via `addSecurityHeaders()` in `lib/security.ts`. These headers instruct the browser on how to handle the response and mitigate classes of client-side attacks:

| Header | Purpose |
|---|---|
| `X-Frame-Options: DENY` | Prevents clickjacking via iframe embedding |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing attacks |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limits referrer information leakage |
| `Content-Security-Policy` | Restricts which scripts/styles can execute |

### Known Gap: `unsafe-inline` in CSP

The current CSP includes `unsafe-inline`, which weakens its protection against Cross-Site Scripting (XSS). A CSP with `unsafe-inline` does not block inline scripts injected by an attacker. The correct fix is to implement **nonce-based CSP**: the server generates a cryptographically random nonce per request, includes it in the CSP header, and adds it to each legitimate `<script>` tag. Only scripts with the matching nonce execute. This is a documented gap to be addressed.

---

## Rate Limiting

Two endpoints are rate limited using an in-memory limiter defined in `lib/rateLimit.ts`:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/register` | 5 requests per 15 minutes per IP |
| `POST /api/contact` | 100 requests per 15 minutes per IP |

Registration is tightly limited because the endpoint validates tokens and sets passwords — a high-rate attack against it could be used to brute-force token values. The contact endpoint is more permissive because it only logs messages, but is still limited to prevent abuse.

### Known Gap: In-Memory Limiter on Serverless

The current rate limiter stores state in a `Map` in process memory. On Vercel's serverless platform, each function invocation may run in a different container with no shared memory. This means the rate limiter provides no protection in production — each new serverless instance starts with a fresh counter.

The correct fix is to use a distributed rate limiter backed by **Upstash Redis**, which provides an HTTP API that serverless functions can call without maintaining a persistent connection. This is a documented gap.

---

## Input Validation

All user-supplied input is validated with **Zod** schemas defined in `lib/validation.ts`. Zod performs runtime type checking and returns structured error messages for invalid input. Validation happens at the route handler layer before any service or database call, ensuring malformed data never reaches business logic.

---

## Summary

| Control | Implementation |
|---|---|
| Session management | NextAuth v5, JWT-signed sessions |
| Password hashing | bcryptjs |
| Registration gating | Single-use token, 24-hour expiry, payment-gated |
| Route protection | Middleware (coarse) + role check (fine-grained) |
| Security headers | Applied to every response via `addSecurityHeaders()` |
| Rate limiting | In-memory (dev only; needs Upstash Redis for production) |
| Input validation | Zod schemas at the route handler layer |
