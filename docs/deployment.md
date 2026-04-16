# Deployment

Both the frontend and backend deploy independently. The recommended platform is Vercel for both, but any Node.js host works for the backend and any static CDN for the frontend.

---

## Pre-deployment Checklist

- [ ] All env vars set in the host's environment (not committed to git)
- [ ] `NEXTAUTH_SECRET` rotated — do not reuse the dev value
- [ ] `NEXTAUTH_URL` set to the production backend URL
- [ ] `FRONTEND_ORIGIN` set to the production frontend URL
- [ ] `SUPABASE_URL` and service role key configured
- [ ] Supabase SQL applied — run `backend/supabase/additional_tables.sql` in the SQL editor
- [ ] Stripe webhook endpoint registered in the Stripe dashboard
- [ ] Resend sending domain verified
- [ ] `FORMS_WEBHOOK_SECRET` generated and set
- [ ] **Rate limiter migrated to Upstash Redis before any public traffic** (see Security section)

---

## Backend (Next.js)

### Vercel (recommended)

1. Import the `backend/` directory as a separate Vercel project.
2. Set all env vars in Project → Settings → Environment Variables.
3. On first deploy, Vercel detects Next.js automatically.

### Required env vars in production

| Variable | Notes |
|---|---|
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | e.g. `https://api.yourclub.com` |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
| `FRONTEND_ORIGIN` | e.g. `https://yourclub.com` — no trailing slash |
| `STRIPE_SECRET_KEY` | Live key from Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint settings |
| `STRIPE_PRICE_ID_MONTHLY` | Live price ID |
| `STRIPE_PRICE_ID_ANNUAL` | Live price ID |
| `SUPABASE_URL` | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (safe to expose) |
| `RESEND_API_KEY` | From Resend dashboard |
| `FROM_EMAIL` | Verified sender address |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob settings |
| `FORMS_WEBHOOK_SECRET` | Generate: `openssl rand -base64 32` |
| `FORMS_DEFAULT_POINTS` | Default `1` |
| `UPSTASH_REDIS_REST_URL` | Required before public launch |
| `UPSTASH_REDIS_REST_TOKEN` | Required before public launch |

### Stripe webhook setup

1. In the Stripe dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://<backend-domain>/api/webhooks/stripe`
3. Events to subscribe:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Max function duration

All admin and webhook routes set `export const maxDuration = 30` (seconds). Vercel Hobby plan caps at 10 seconds — upgrade to Pro or ensure all operations complete within that limit. Stripe and Supabase calls typically complete in under 2 seconds.

---

## Frontend (React / Vite)

### Vercel (recommended)

1. Import the `frontend/` directory as a separate Vercel project.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var: `VITE_API_URL=https://<backend-domain>`

### SPA routing

Vercel handles SPA routing automatically. For other hosts, configure the server to return `index.html` for all non-asset paths:

- Nginx: `try_files $uri /index.html;`
- Apache: `FallbackResource /index.html`
- Netlify: `_redirects` file with `/* /index.html 200`

---

## Supabase

### Schema setup

Run `backend/supabase/additional_tables.sql` in the Supabase SQL editor before first use. The file is idempotent (`CREATE TABLE IF NOT EXISTS`).

### Row-Level Security

The backend uses the service role key (`SUPABASE_SERVICE_ROLE_KEY`) which bypasses RLS. If you enable RLS on tables, the backend will still function, but you should test all operations to confirm.

The anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is used for client-side Supabase Auth operations only. It does not have write access to application tables.

### Deleting users

`auth.users` cascades to `profiles`. Membership records have no cascade and are explicitly deleted by `membershipService.deleteByUserId` before the user delete. Attendance and point_transactions cascade via `user_id`.

---

## CORS

`middleware.ts` restricts `Access-Control-Allow-Origin` to the exact value of `FRONTEND_ORIGIN`. Set this to your production frontend domain. Any mismatch will cause all API calls from the frontend to fail with CORS errors.

If the frontend is on a different subdomain or port than expected, update this variable — do not broaden to `*`.

---

## Security Concerns Before Launch

### 1. In-memory rate limiter — must fix

The current `lib/rateLimit.ts` uses a process-local `Map`. On Vercel serverless, each function invocation may run in a separate process. The rate limiter provides no protection in production.

**Steps to fix:**
1. `npm install @upstash/ratelimit @upstash/redis` in `backend/`.
2. Create a Redis database at upstash.com (free tier sufficient).
3. Rewrite `lib/rateLimit.ts` using `@upstash/ratelimit`. Keep the same exported function signatures — no callers need to change.
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 2. CSP unsafe-inline — medium priority

`Content-Security-Policy` includes `unsafe-inline` for scripts and styles. This weakens protection against XSS.

**Steps to fix:**
1. Migrate inline styles in `AdminPage.jsx`, `DashboardPage.jsx`, and other frontend pages to CSS modules or a stylesheet.
2. Generate a per-request nonce in `lib/security.ts` and thread it through Next.js `<Script>` tags.
3. Replace `unsafe-inline` with `'nonce-<value>'` in the CSP header.

### 3. Stripe webhook idempotency — low priority

If Stripe retries a `checkout.session.completed` event, a duplicate user and membership will be created.

**Steps to fix:** In `app/api/webhooks/stripe/route.ts`, before creating a user check `repositories.user.findByEmail`. Before creating a membership check `findByStripeCustomerId`. Skip creation if the record already exists.

### 4. Contact form not emailing — informational

Submissions are logged to console only. Add `sendContactNotification` to `lib/email.ts` and call it from `app/api/contact/route.ts`.

---

## Environment-Specific Behaviors

| Behavior | Dev (no SUPABASE_URL) | Production |
|---|---|---|
| Database | In-memory stubs (reset on restart) | Supabase PostgreSQL |
| Email | Logged to console | Sent via Resend |
| Seed endpoint | Available at `POST /api/dev/seed` | Returns 404 |
| HSTS header | Not set | Set (`max-age=63072000`) |
| Rate limiter | In-memory (works per-process) | Must use Upstash |

---

## Post-deploy Verification

1. `GET https://<backend>/api/staff` — returns 200 with empty array (no seed data in prod)
2. Complete a Stripe test checkout using a `4242 4242 4242 4242` test card
3. Confirm welcome email arrives and registration link works
4. Sign in with the registered account, verify dashboard loads
5. Sign in as admin, verify all four admin tabs render and load data
6. Submit a forms webhook test:
   ```bash
   curl -X POST https://<backend>/api/webhooks/forms \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $FORMS_WEBHOOK_SECRET" \
     -d '{"email":"<registered-email>","event_name":"Test","event_date":"<today ISO>"}'
   ```
7. Confirm points appear on the member dashboard
