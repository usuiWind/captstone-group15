# API — Webhooks

---

## POST /api/webhooks/forms

Receives form submissions from Google Forms (via Apps Script) or Microsoft Forms (via Power Automate) and automatically awards attendance points to the matching member.

**Auth:** `Authorization: Bearer <FORMS_WEBHOOK_SECRET>` (verified with `crypto.timingSafeEqual` — timing-safe)

**Required env vars:** `FORMS_WEBHOOK_SECRET`, `FORMS_DEFAULT_POINTS` (optional, default `1`)

### Request body

```json
{
  "email":      "member@example.com",
  "event_name": "Weekly Meeting",
  "event_date": "2026-04-09T18:00:00Z",
  "points":     2
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | yes | Must match the member's registered email exactly |
| `event_name` | string | no | Stored as the attendance reason; matched against `events.title` (case-insensitive) |
| `event_date` | ISO 8601 datetime | yes | Must not be in the future; must not be more than 30 days in the past |
| `points` | integer 1–100 | no | Omit to use `FORMS_DEFAULT_POINTS`. **Recommended:** omit and fix the value in env to prevent members inflating their own score |

### Point calculation flow

1. Webhook validates payload (Zod — rejects future dates, >30-day-old dates, points > 100)
2. `repositories.user.findByEmail(email)` resolves email → UUID
3. `attendanceService.createAttendance({ userId, date, eventName, points })` is called
4. Inside the repository:
   - If `eventName` matches a row in `events`, `events.points_value` takes precedence over the submitted `points` (canonical event value wins)
   - Otherwise the submitted `points` (or `FORMS_DEFAULT_POINTS`) is used
5. One `attendance` row and one `point_transactions` row are created atomically
6. `getTotalPoints` sums all `point_transactions.points` for the user — this is the authoritative leaderboard value

### Unmatched submissions

If the email doesn't match any user, the raw payload is inserted into `unmatched_form_submissions` (Supabase) for admin review and the webhook returns `200` — prevents Power Automate / Apps Script from retrying indefinitely.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `email` | text | The unmatched email |
| `raw_payload` | jsonb | Full request body |
| `received_at` | timestamptz | |
| `resolved` | boolean | Manually set to `true` after admin reconciles |

### Response

| Case | HTTP | Body |
|---|---|---|
| Success, user matched | 200 | `{ success: true, matched: true }` |
| Success, user not found | 200 | `{ success: true, matched: false }` |
| Invalid/missing secret | 401 | `{ success: false, error: "Unauthorized" }` |
| Invalid payload | 400 | `{ success: false, error: "<validation message>" }` |
| Webhook not configured | 500 | `{ success: false, error: "Webhook not configured" }` |

### Google Forms setup (Apps Script)

In your Google Form → Extensions → Apps Script, add an `onFormSubmit` trigger:

```javascript
function onFormSubmit(e) {
  var email = e.response.getRespondentEmail(); // requires "Collect email addresses"
  var payload = {
    email:      email,
    event_name: "Weekly Meeting",
    event_date: new Date().toISOString(),
    // omit points — controlled by FORMS_DEFAULT_POINTS on the server
  };
  UrlFetchApp.fetch("https://your-backend.vercel.app/api/webhooks/forms", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: { "Authorization": "Bearer YOUR_FORMS_WEBHOOK_SECRET" },
    muteHttpExceptions: true
  });
}
```

### Microsoft Forms setup (Power Automate)

1. Trigger: **Microsoft Forms — When a new response is submitted**
2. Action: **Microsoft Forms — Get response details**
3. Action: **HTTP — POST** to `https://your-backend.vercel.app/api/webhooks/forms`
   - Headers: `Authorization: Bearer YOUR_FORMS_WEBHOOK_SECRET`, `Content-Type: application/json`
   - Body: `{ "email": "<respondent email field>", "event_name": "Weekly Meeting", "event_date": "<utcNow()>" }`

---

## POST /api/webhooks/stripe

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
