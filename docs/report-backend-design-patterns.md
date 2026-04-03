# Backend Design Patterns Report

## Overview

This report covers the structural design patterns used in the backend codebase: the Repository pattern, the Dependency Injection container, and the Service layer. Together these patterns enforce a clean separation between business logic and data access, and enable local development without a live database.

---

## The Repository Pattern

A **repository** is an abstraction over data storage. Instead of calling a database directly from business logic, the service layer calls methods on a repository interface such as `findByUserId(id)` or `create(data)`. The repository is responsible for translating those calls into actual database queries.

### Why Use It Here

The primary motivation was **testability and local development**. Supabase requires a live connection and real credentials. During development — especially in a team setting — it is impractical to require every developer to spin up or connect to a shared database. By defining repository interfaces first, the team can write two implementations:

1. **Stub repositories** (`lib/repositories/stubs/`) — store data in in-memory `Map` objects. No database required. State resets on server restart.
2. **Supabase repositories** (`lib/repositories/supabase/`) — production implementations that issue real SQL queries via the Supabase client.

Both implementations satisfy the same TypeScript interface defined in `lib/interfaces/repositories.ts`, so the rest of the codebase cannot tell them apart.

### Interface-First Design

Defining the interface before the implementation forces the team to think about what operations are actually needed, independent of how they will be stored. For example:

```
IUserRepository
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
```

This contract is stable even if the database changes (e.g., migrating from Supabase to PlanetScale). Only the repository implementation changes; services and route handlers are unaffected.

---

## The Dependency Injection Container

`lib/container.ts` is the single place in the application where repository implementations are chosen. It exports a `repositories` object assembled at startup:

```
if SUPABASE_URL is set:
    repositories = { users: SupabaseUserRepo, memberships: SupabaseMembershipRepo, ... }
else:
    repositories = { users: StubUserRepo, memberships: StubMembershipRepo, ... }
```

All services and route handlers import from `container.ts` — never from a specific implementation file. This is a lightweight form of **Dependency Injection (DI)**: the dependency (database implementation) is provided externally rather than constructed inside the consumer.

### Why Not a Full DI Framework

Frameworks like InversifyJS or tsyringe provide runtime DI containers with decorators, lifecycle management, and scope control. For a project of this scale, that machinery adds complexity without meaningful benefit. The environment-variable switch in `container.ts` achieves the same result (swappable implementations) with a handful of lines of code.

### Staff and Sponsor Repositories

Staff and sponsor data are always backed by stub repositories, even in production. The rationale is that this content (staff bios, sponsor logos) is managed through the admin UI and served publicly. It could be wired to Supabase tables in the future, but the stub behavior is acceptable for the current scope. The container makes this explicit — you can see at a glance which repositories are environment-switched and which are always stubs.

---

## The Service Layer

Services live in `lib/services/` and contain all business logic. A service method:

- Accepts plain data (not HTTP request objects)
- Calls one or more repositories
- May call external APIs (Stripe, Resend)
- Returns a result or throws a typed error

Services have **no knowledge of HTTP**. They do not access `req`, `res`, or response status codes. This is intentional — it means a service method can be called from a route handler, a cron job, a webhook handler, or a test, without modification.

### Example: Membership Cancellation

The cancellation flow demonstrates why this separation matters:

1. Route handler parses the request, extracts `session.user.id`, validates authentication
2. Route handler calls `membershipService.cancelMembership(userId)`
3. Service fetches the membership record from the repository
4. Service calls the Stripe API to set `cancel_at_period_end = true`
5. Service updates the local membership record via the repository
6. Service returns the updated membership object
7. Route handler wraps the result in `{ success: true, data: ... }` and returns 200

If the Stripe call fails in step 4, the service throws. The route handler catches it and returns a 500. The service never constructs an HTTP response — that is not its job.

---

## TypeScript Contracts (`lib/interfaces/`)

`models.ts` defines the shape of all domain entities: `User`, `Membership`, `AttendanceRecord`, `Staff`, `Sponsor`, `VerificationToken`. These are plain TypeScript interfaces — no runtime overhead, no ORM decorators.

`repositories.ts` defines the repository interfaces that implementations must satisfy. TypeScript's structural typing means any object that has the required methods is a valid implementation, whether it hits a database or a `Map`.

This contract layer is what makes the stub-to-Supabase swap safe. The compiler will reject a stub that is missing a method required by the interface.

---

## Summary

The backend's design centers on three cooperating patterns:

| Pattern | Purpose |
|---|---|
| Repository | Isolates database access behind a stable interface |
| DI Container | Selects the correct implementation at startup based on environment |
| Service Layer | Holds business logic free of HTTP and database concerns |

Together they allow the application to run fully in-memory during development, swap database implementations without touching business logic, and keep route handlers thin and focused on HTTP concerns.
