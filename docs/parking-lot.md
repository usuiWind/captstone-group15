# Parking Lot — Future Goals & Known Static Content

Everything here is deferred — either intentionally out of scope for launch, or a known gap that needs a future sprint. Items are grouped by theme.

---

## 1. Announcements System

**Current state:** The `Announcements` section on the Home page is not a real announcements system. It piggybacks on the `events` table — it calls `GET /api/events?all=true` and renders any event that has a non-empty `description` field as an "announcement card." There is no dedicated announcements table, no admin UI for writing announcements, and no way to post a message that isn't tied to an event.

**What a real implementation needs:**
- A new `announcements` table in Supabase (`id`, `title`, `body`, `published_at`, `expires_at`, `created_by`).
- `GET /api/announcements` — public endpoint, returns active (non-expired) announcements.
- `POST / PATCH / DELETE /api/admin/announcements` — admin CRUD.
- Admin UI tab to write and publish announcements independently of events.
- Home page `Announcements` component updated to call the real endpoint.

---

## 2. Contact Form Email Notification

**Current state:** `POST /api/contact` accepts and validates the submission but only logs it to the server console (`console.log('[CONTACT] New inquiry received:', ...)`). The submitter sees a success response but no one on the team receives the message.

**File:** `backend/app/api/contact/route.ts` line 30

**What needs to happen:**
1. Add `sendContactNotification(name, email, message)` to `backend/lib/email.ts` following the existing Resend pattern (same as `sendOtpCode` / `sendAdminOtpEmail`).
2. Call it in `contact/route.ts` after validation passes.
3. Set a `CONTACT_NOTIFICATION_EMAIL` env var for the recipient address, or hardcode the team inbox.

---

## 3. Member MFA (Email OTP)

**Current state:** The endpoint `POST /api/auth/mfa/send-otp` exists and is wired to Resend (with proper bcrypt hashing). However, it is never called by the frontend, and `auth.ts` only enforces OTP for admin-role users. Members log in with just email + password.

**What needs to happen:**
- Add OTP verification to the member branch of `auth.ts → authorize()`.
- Update the frontend login flow to call `/api/auth/mfa/send-otp` after password entry and prompt for the code before completing sign-in.
- Wire the member auth flow the same way as the existing admin OTP flow.

See `docs/mfa-and-forms-plan.md` for the two implementation paths (Email OTP vs TOTP Authenticator App).

---

## 4. Static Components on the Home Page

These sections render hardcoded data instead of pulling from the live API.

### 4a. Photo Gallery (Events & Socials section)

**Current state:** The `EventsGallery` component (`HomePage.jsx` lines 157–166) renders a hardcoded `PHOTOS` array of eight Wix CDN image URLs. There is no way to add, remove, or reorder photos without editing the source code.

**Goal:** Connect to a media management solution. Vercel Blob is already configured for staff/sponsor image uploads — a similar `photos` table or blob prefix could back a gallery CMS page in the admin portal.

### 4b. Sponsors Section

**Current state:** The `Sponsors()` component on the Home page renders a hardcoded `STATIC_SPONSORS` array. The app already has a working `GET /api/sponsors` endpoint and a fully implemented sponsors repository (Supabase + admin CRUD).

**Goal:** Replace `STATIC_SPONSORS` with a `useEffect` fetch to `GET /api/sponsors` — same pattern already used in the Calendar section for events.

### 4c. Calendar Fallback Events

**Current state:** The `CalendarSection` component fetches from `GET /api/events` on mount but falls back to a hardcoded `EVENTS` array (4 placeholder events from March–April 2026) if the fetch fails or returns empty. Those dates are now in the past.

**Goal:** Remove the hardcoded `EVENTS` fallback. Show an empty state ("No events scheduled yet") when the API returns nothing, same as the month-view already does.

---

## 5. Points Goal Configuration

**Current state:** The points goal shown on the Member Dashboard ("Goal: 100 pts" and the progress bar) is hardcoded to `100` in the frontend mock data (`MemberDashboard.jsx` lines 186 and 256). It is not stored in the database and is not returned by any API.

**Goal options:**
- **Site-wide constant** — expose it via an env var or a `settings` table, return it from `GET /api/attendance` alongside `totalPoints`.
- **Per-member** — add a `points_goal` column to `profiles`, let admins set it via `PATCH /api/admin/members`.

---

## 6. Unmatched Form Submissions Admin UI

**Current state:** When a Google/Microsoft Forms check-in arrives at `POST /api/webhooks/forms` with an email that doesn't match any registered user, the payload is stored in the `unmatched_form_submissions` table for admin review. However, there is no UI in the admin portal to view, resolve, or delete these records.

**Goal:** Add an "Unmatched Submissions" tab or panel in the Admin Dashboard that lists unresolved rows from `unmatched_form_submissions` and allows admins to mark them resolved or manually link them to an existing member.

---

## 7. Attendance Records Read-Only Cutoff

**Current state:** In the Admin Dashboard → Attendance tab, past event attendance records still display edit and delete buttons. There is no cutoff date enforcement.

**Goal:** Decide on a policy (e.g., records older than 30 days are read-only, or records tied to past events are locked) and apply it in the frontend attendance tab. Optionally enforce it server-side in `PATCH /api/admin/attendance` as well.

---

## 8. Legal Pages

The footer renders "Privacy Policy" and "Terms" links that both point to `#`. No content pages exist for these.

**Goal:** Create `/privacy` and `/terms` React routes with appropriate legal copy, or link out to hosted documents (Notion, Google Docs, etc.).

---

## 9. CSP Nonce (Post-Launch Hardening)

**Current state:** The `Content-Security-Policy` header includes `unsafe-inline` for both scripts and styles. This allows inline JavaScript to execute, weakening the XSS defence.

**Goal:**
1. Migrate inline styles in `AdminPage.jsx` and `MemberDashboard.jsx` to CSS modules or a stylesheet.
2. Generate a per-request nonce in `lib/security.ts → addSecurityHeaders()`.
3. Replace `unsafe-inline` with `'nonce-<value>'` in the CSP header.

This is intentionally deferred post-launch because of the large number of inline styles across the frontend.
