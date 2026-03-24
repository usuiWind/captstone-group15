# API — Membership

All membership routes require an authenticated session (401 if missing).

---

## GET /api/membership

Returns the calling user's active membership record.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "42",
    "userId": "uuid",
    "status": "ACTIVE",
    "planName": "Monthly",
    "stripeCustomerId": "cus_...",
    "stripeSubscriptionId": "sub_...",
    "currentPeriodStart": "2026-03-01T00:00:00.000Z",
    "currentPeriodEnd": "2026-04-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Responses**
| Status | Meaning |
|--------|---------|
| 200 | Membership found |
| 401 | Not authenticated |
| 404 | No membership record for this user |

---

## POST /api/membership/cancel

Cancels the calling user's subscription at the end of the current billing period.
Calls Stripe `cancel_at_period_end` then sets `cancelAtPeriodEnd = true` locally.
The membership stays `ACTIVE` until the period ends; Stripe then fires
`customer.subscription.deleted` → status becomes `CANCELLED`.

**Request body**: empty `{}`

**Response 200**
```json
{ "success": true, "data": { ...updatedMembership } }
```

**Responses**
| Status | Meaning |
|--------|---------|
| 200 | Cancellation scheduled |
| 401 | Not authenticated |
| 404 | No membership found |
| 500 | Stripe call failed |

---

## Membership Status Values

| Value | Meaning |
|-------|---------|
| `PENDING` | Checkout complete, registration email not yet clicked |
| `ACTIVE` | Payment succeeded, account in good standing |
| `PAST_DUE` | Payment failed, Stripe retrying |
| `CANCELLED` | Subscription deleted |
| `EXPIRED` | Period ended without renewal |

---

## Notes

- There is no `POST /api/membership` — memberships are created automatically by the
  Stripe webhook (`checkout.session.completed`). See `api-webhooks.md`.
- `planName` is sourced from the Stripe price `nickname` field; set this in the
  Stripe dashboard when creating prices.
