# API Design Report

## Overview

This report describes how the backend REST API is structured, the conventions applied across all endpoints, and the reasoning behind the access control model and endpoint organization.

---

## REST Conventions

All endpoints follow a consistent request/response contract. Every response body uses the same envelope structure:

```json
{ "success": boolean, "data": <payload>, "error": "string" }
```

- On success: `{ "success": true, "data": ... }`
- On failure: `{ "success": false, "error": "Human-readable message" }`

This consistency means the frontend only needs one response-parsing pattern regardless of which endpoint it calls. Error messages are human-readable strings rather than numeric codes, which simplifies client-side error display.

HTTP status codes are used conventionally:

| Code | Meaning in this API |
|---|---|
| 200 | Request succeeded |
| 400 | Client sent invalid or missing data |
| 401 | Request is not authenticated |
| 403 | Request is authenticated but lacks permission |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## Endpoint Organization

Endpoints are organized into four logical groups by access level and domain:

### Public Endpoints (`/api/staff`, `/api/sponsors`, `/api/contact`)

No authentication required. These serve data that is displayed on the public-facing website (staff directory, sponsor logos) and accept contact form submissions. Rate limiting is applied to the contact endpoint to prevent abuse.

The public endpoints are read-only for content (staff, sponsors) and write-only for user input (contact). There are no unauthenticated endpoints that expose member data.

### Auth Endpoints (`/api/auth/...`)

Handled by NextAuth with one custom addition: `POST /api/auth/register`. The register endpoint handles the token-based account activation flow. All other auth endpoints (sign-in, session retrieval, CSRF) are managed by NextAuth's catch-all handler and should not be called directly.

### Member Endpoints (`/api/membership`, `/api/attendance`)

Require a valid session. Return data scoped to the calling user — a member can only see their own membership record and attendance history, never another member's. Scoping is enforced in the service layer by passing `session.user.id` rather than accepting a `userId` parameter from the request.

This is an important security property: the endpoint does not trust the client to identify itself. It reads the identity from the verified session token.

### Admin Endpoints (`/api/admin/...`)

Require a valid session where `session.user.role === 'ADMIN'`. Admin endpoints can read and write data across all users, making role verification critical. A 403 is returned if an authenticated non-admin attempts access. Admin capabilities include:

- Listing all members with their membership status (with optional status filter)
- Creating attendance records for any user
- Managing staff and sponsor content (create, update, soft-delete)

---

## Why No `POST /api/membership`

There is intentionally no endpoint to create a membership directly. Memberships are created exclusively by the Stripe webhook handler when `checkout.session.completed` fires. This design ensures:

- Every membership is backed by a real payment
- The creation path cannot be bypassed by calling the API directly
- Membership creation logic lives in one place

This is an example of **application invariant enforcement at the API boundary**: the shape of the API makes it structurally impossible to create a membership without going through Stripe.

---

## File Upload Pattern (Staff & Sponsors)

Admin endpoints for managing staff and sponsors accept `multipart/form-data` rather than JSON. This allows image files to be uploaded in the same request as the record data. Images are stored in Vercel Blob and the resulting URL is saved to the database record. The frontend never handles the raw binary — it submits a `FormData` object and receives a URL in return.

If `BLOB_READ_WRITE_TOKEN` is not configured, image fields are silently ignored. This allows the admin UI to function in environments without Blob access, at the cost of missing images.

---

## Query Parameter Filtering

The `GET /api/admin/members` endpoint supports a `status` query parameter to filter results by membership status (`ACTIVE`, `PENDING`, etc.). This keeps the API lean — rather than adding separate endpoints for each filter, a single endpoint handles the general case and filtering is optional.

---

## Attendance: Asymmetric Read/Write Access

The attendance domain has an asymmetric access model:

- `GET /api/attendance` — authenticated member reads their own records
- `POST /api/admin/attendance` — admin creates records for any user

Members cannot submit their own attendance. An admin must log attendance on their behalf. This prevents self-reporting abuse (a member claiming attendance at events they did not attend). The tradeoff is that the admin interface must be used for every attendance entry, but for a club context this is the correct control.

---

## Validation Layer

Zod schemas in `lib/validation.ts` validate all incoming request bodies before they reach the service layer. Zod performs runtime type checking and coercion (e.g., ensuring `points` is a non-negative number, not a string). Invalid requests are rejected with 400 before any database or business logic runs. This keeps services clean — they can assume their inputs are well-formed.

---

## Summary

The API is organized around access level (public, authenticated, admin) and designed to enforce application invariants through its structure (e.g., memberships can only be created via webhooks). Consistent response envelopes, standard HTTP status codes, and Zod validation provide a predictable and defensible interface for the frontend to consume.
