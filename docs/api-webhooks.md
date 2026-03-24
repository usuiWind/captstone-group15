# API — Stripe Webhooks

## POST /api/webhooks/stripe

Stripe sends signed POST requests here for subscription lifecycle events.
The endpoint verifies the `Stripe-Signature` header before processing (returns 400 on failure).

**Required env vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Handled Events

### `checkout.session.completed`
Fires when a user completes Stripe Checkout.

1. Creates a `User` record (status `PENDING`) from `session.customer_details`
2. Creates a `Membership` record (status `PENDING`)
3. Generates a single-use UUID verification token (expires 24 h)
4. Sends welcome email via Resend with link: `{APP_URL}/register?token=<uuid>`

### `invoice.payment_succeeded`
Sets membership `status = ACTIVE`, updates `currentPeriodStart/End`.
Sends a payment confirmation email.

### `invoice.payment_failed`
Sets membership `status = PAST_DUE`.
Sends a payment-failed notification email.

### `customer.subscription.deleted`
Sets membership `status = CANCELLED`.
Sends a cancellation confirmation email.

### `customer.subscription.updated`
Updates `planName`, `currentPeriodStart/End`, `cancelAtPeriodEnd`.
Sends subscription-updated email if the plan name changed.

---

## Local Testing with Stripe CLI

```bash
# Install Stripe CLI, then:
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI prints a webhook signing secret — set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

Trigger a test event:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

---

## Notes

- Webhook processing is **not idempotent** — duplicate `checkout.session.completed`
  events will attempt to create a second user/membership. Add a guard on
  `stripeCustomerId` uniqueness if Stripe retries.
- `NEXT_PUBLIC_APP_URL` must be set for the registration link in welcome emails.
