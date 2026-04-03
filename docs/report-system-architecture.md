# System Architecture Report

## Overview

This report describes the top-level architectural decisions made for the club management web application, including deployment structure, technology selection, and the rationale behind each choice.

---

## Deployment Model

The application is split into two independently deployed services that communicate over HTTP:

```
Browser → React/Vite (frontend)
              ↓ HTTP (fetch to VITE_API_URL)
       Next.js App Router (backend)
              ↓
         Supabase · Stripe · Vercel Blob · Resend
```

This separation — often called a **decoupled** or **headless** architecture — was chosen deliberately rather than using a single monolithic framework for both rendering and API. The key tradeoffs:

| Concern | Decoupled (chosen) | Monolithic alternative |
|---|---|---|
| Frontend flexibility | React/Vite can be swapped independently | Frontend tied to backend framework |
| Deployment targets | Frontend can go to any static host | Both must colocate |
| Dev velocity | Frontend and backend teams work in parallel | Merge conflicts more common |
| Complexity | Requires CORS configuration | Simpler local setup |

The backend API is stateless, which makes it well-suited to serverless deployment on Vercel. The frontend is a static bundle served from a CDN.

---

## Technology Stack

### Frontend: React + Vite

React was chosen for its component model and ecosystem maturity. Vite replaces the older Create React App toolchain; it uses native ES modules during development, resulting in significantly faster hot module replacement (HMR). Because the frontend is purely client-side rendered (CSR), it can be deployed as a static export to any CDN without server infrastructure.

### Backend: Next.js App Router

Next.js was selected for the backend because its **App Router** provides a file-system-based routing convention that maps directly to REST endpoint structure (`app/api/membership/route.ts` → `GET /api/membership`). This eliminates the boilerplate of a standalone Express or Fastify server while still producing standard HTTP handlers. Next.js also integrates cleanly with NextAuth, which handles session management.

The App Router runs as serverless functions on Vercel, meaning each route handler scales independently and the team does not manage a persistent server process.

### Database: Supabase (PostgreSQL)

Supabase provides a hosted PostgreSQL instance with a REST and real-time interface. PostgreSQL was the correct choice for this domain because membership data, attendance records, and user accounts have well-defined relational structure. A document store would have introduced unnecessary schema flexibility where strict consistency is required (e.g., a membership must always reference a valid user).

Supabase was preferred over raw PostgreSQL hosting because it provides:
- Managed connection pooling
- Built-in authentication primitives (not used here but available)
- A web UI for direct data inspection during development

### Payments: Stripe

Stripe handles all payment processing. The application never stores raw payment card data — Stripe Checkout redirects users to a Stripe-hosted page, keeping PCI compliance scope minimal. Subscription billing (recurring charges, renewal, cancellation) is managed entirely by Stripe. The backend only reacts to webhook events to update local records.

### Email: Resend

Resend is a transactional email API. It was chosen over alternatives like SendGrid for its simple API and developer-friendly dashboard. The email client falls back to `console.log` when no API key is present, which means local development works without any email infrastructure.

### File Storage: Vercel Blob

Staff and sponsor profile images are stored in Vercel Blob, a managed object store. This avoids storing binary assets in PostgreSQL (a common antipattern that inflates database size and makes backups slower) and keeps image delivery on a CDN edge.

---

## Architectural Boundaries

A key discipline in this codebase is that each layer only knows about the layer directly below it:

- **Route handlers** (`app/api/`) — handle HTTP only: parse requests, call services, return responses
- **Services** (`lib/services/`) — contain business logic only: no database calls, no HTTP knowledge
- **Repositories** (`lib/repositories/`) — contain all database access: no business logic

This layering is enforced by convention rather than by the runtime. A route handler that reached directly into a Supabase client would be considered a violation. The benefit is that business logic can be tested without a database, and the database implementation can be swapped without touching business logic.

---

## Summary

The architecture prioritizes deployment simplicity (serverless), developer experience (fast local dev with stubs, no database required), and a clean separation of concerns (HTTP → service → repository). Third-party services (Stripe, Resend, Vercel Blob, Supabase) are used for capabilities that would otherwise require significant infrastructure effort to build and maintain.
