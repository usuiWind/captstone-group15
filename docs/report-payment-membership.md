# Payment & Membership System Report

## Overview

This report describes how the application integrates with Stripe for payment processing, how membership records are managed, and how the system responds to subscription lifecycle events via webhooks.

---

## Design Philosophy: Stripe as the Source of Truth

A foundational decision in this system is that **Stripe owns the subscription state**. The application's local database (Supabase) holds a membership record that mirrors the Stripe state, but it is always Stripe that initiates state changes. The backend never directly sets a membership to `ACTIVE` or `CANCELLED` based on user action — it only reacts to events that Stripe sends.

This approach has several advantages:

- **Payment security:** The application never handles card data. Stripe Checkout redirects users to a Stripe-hosted page, keeping PCI scope to a minimum.
- **Retry handling:** If a payment fails, Stripe handles retry logic automatically. The backend simply listens for the outcome.
- **Consistency:** The local database state is always derivable from Stripe's event history. If the local record is ever out of sync, replaying webhooks can restore it.

---

## Membership Lifecycle

Membership records progress through a defined set of states:

```
PENDING → ACTIVE → PAST_DUE → ACTIVE (if payment recovered)
                             → CANCELLED (if subscription deleted)
       → CANCELLED (if never activated)
```

| Status | Meaning |
|---|---|
| `PENDING` | Stripe Checkout completed; user has not yet clicked the registration link |
| `ACTIVE` | Payment succeeded; account is in good standing |
| `PAST_DUE` | A renewal payment failed; Stripe is retrying |
| `CANCELLED` | Subscription was deleted; access should be revoked |
| `EXPIRED` | Period ended without renewal (non-recurring plans) |

The state machine is driven entirely by Stripe webhook events. No user action directly changes a membership status — even cancellation goes through Stripe first.

---

## Stripe Checkout Flow

When a new user purchases a membership:

1. The frontend redirects the user to a **Stripe Checkout** session URL.
2. The user enters payment details on the Stripe-hosted page.
3. Stripe processes the payment and fires `checkout.session.completed`.
4. The backend webhook handler receives the event, verifies the signature, and:
   - Creates a `User` record with status `PENDING`
   - Creates a `Membership` record with status `PENDING`
   - Generates a single-use UUID verification token (24-hour expiry)
   - Sends a welcome email via Resend with a link to `/register?token=<uuid>`

The user account does not exist until payment succeeds. This eliminates the need for a separate "create account, then subscribe" flow and ensures every account holder is a paying member.

---

## Webhook Processing

The endpoint `POST /api/webhooks/stripe` receives all Stripe event notifications. Before any processing occurs, the handler verifies the `Stripe-Signature` header using the `STRIPE_WEBHOOK_SECRET`. This signature is an HMAC computed by Stripe using a shared secret. Verification ensures:

- The request actually came from Stripe (not a spoofed request)
- The payload has not been tampered with in transit

If verification fails, the handler returns 400 immediately.

### Handled Events

**`checkout.session.completed`**
The entry point for new members. Creates user, membership, token, and sends the welcome email as described above.

**`invoice.payment_succeeded`**
Fires on each successful billing cycle. Sets membership `status = ACTIVE` and updates `currentPeriodStart` and `currentPeriodEnd`. This is also the event that activates a membership after the initial checkout — Stripe fires `checkout.session.completed` first, then `invoice.payment_succeeded` for the first invoice.

**`invoice.payment_failed`**
Sets membership `status = PAST_DUE`. Sends a payment failure notification email. Stripe will continue to retry the payment according to its retry schedule. If a later retry succeeds, `invoice.payment_succeeded` fires and the status returns to `ACTIVE`.

**`customer.subscription.deleted`**
Sets membership `status = CANCELLED`. This fires either when Stripe gives up on a failed payment after exhausting retries, or when a cancellation reaches the end of the billing period.

**`customer.subscription.updated`**
Handles plan changes and subscription modifications. Updates `planName`, `currentPeriodStart`, `currentPeriodEnd`, and `cancelAtPeriodEnd` from the event payload.

---

## Cancellation Flow

A user who wants to cancel does not immediately lose access. The system uses Stripe's `cancel_at_period_end` mechanism:

```
User requests cancellation
  → POST /api/membership/cancel
  → membershipService.cancelMembership(userId)
  → Stripe: subscription.cancel_at_period_end = true
  → Local DB: cancelAtPeriodEnd = true (status stays ACTIVE)

End of billing period
  → Stripe fires customer.subscription.deleted
  → Webhook handler: status = CANCELLED
```

This design respects that the user has already paid for the current period. They retain access until the period ends, and no refund logic is needed. The `cancelAtPeriodEnd` flag in the local database lets the frontend warn the user that their subscription will not renew.

---

## Email Notifications

The system sends transactional emails via Resend at key lifecycle points:

| Event | Email Sent |
|---|---|
| `checkout.session.completed` | Welcome email with registration link |
| `invoice.payment_succeeded` | Payment confirmation |
| `invoice.payment_failed` | Payment failure notification |
| `customer.subscription.deleted` | Cancellation confirmation |
| `customer.subscription.updated` (plan change) | Subscription updated notification |

The email client (`lib/email.ts`) falls back to `console.log` when `RESEND_API_KEY` is not set. This means all email-adjacent code paths are exercised during local development without actually sending email.

---

## Known Gaps

### Webhook Idempotency

The current webhook handler does not guard against duplicate events. Stripe may deliver the same event more than once (e.g., if the handler returned an error on a previous attempt). A duplicate `checkout.session.completed` would attempt to create a second user and membership for the same Stripe customer. The fix is to check for an existing user/membership by `stripeCustomerId` before creating new records.

### Stripe API Version Mismatch

The installed `stripe` npm package version does not match the API version specified in `lib/stripe.ts`, producing a build warning. This should be resolved by bumping the package to match.

---

## Summary

The payment and membership system delegates all financial state to Stripe and reacts to webhook events to keep the local database in sync. This minimizes the application's PCI scope, leverages Stripe's retry and lifecycle management, and keeps the backend logic straightforward: receive an event, verify it, update the local record accordingly.
