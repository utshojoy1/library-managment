# Library Management System — Plan

**Stack:** Nuxt 4 · PostgreSQL 16 · Drizzle ORM
**Status:** v2 shipped — accounts, roles, circulation (2026-11-06)
**Repo:** `github.com/utshojoy1/libery-managment`

---

## Contents

1. [What shipped](#1-what-shipped)
2. [Roles & access](#2-roles--access)
3. [Running it](#3-running-it)
4. [Architecture](#4-architecture)
5. [Data model](#5-data-model)
6. [Auth design](#6-auth-design)
7. [Business rules](#7-business-rules)
8. [API](#8-api)
9. [Project layout](#9-project-layout)
10. [Verification](#10-verification)
11. [Deferred](#11-deferred)
12. [Roadmap](#12-roadmap)
13. [Decisions log](#13-decisions-log)

---

## 1. What shipped

A staff + member web app with real accounts: catalog, members, issue/return, and a super-admin screen for access management.

| Screen | Route | Access |
|---|---|---|
| Login | `/login` | public |
| Register | `/register` | public |
| Dashboard | `/` | signed in — staff see library stats, members see their own loans |
| Catalog | `/catalog` | signed in — staff can add titles |
| Members | `/members` | staff |
| Circulation | `/circulation` | staff |
| Users & access | `/admin/users` | super admin |

Stack as built: Nuxt 4.6.4 (Nitro 2.13.6, Vue 3.5.45), PostgreSQL 16.15 in Docker, Drizzle ORM 0.45.4 + drizzle-kit 0.31.11, `pg` 8.23.1, Node 24. Hand-written CSS, no UI framework, no state library.

---

## 2. Roles & access

Three roles, ordered: `member` < `admin` < `super_admin`.

| Capability | Member | Admin | Super admin |
|---|:--:|:--:|:--:|
| Browse catalog | ✓ | ✓ | ✓ |
| See own loans | ✓ | — | — |
| Add books / copies | — | ✓ | ✓ |
| Manage members | — | ✓ | ✓ |
| Issue / return | — | ✓ | ✓ |
| Manage accounts (role, disable) | — | — | ✓ |

Enforcement is layered:

1. **Server** — every route calls `requireUser()` or `requireRole()`. This is the real boundary; the UI is cosmetic by comparison.
2. **Route middleware** — `app/middleware/auth.global.ts` resolves `/api/auth/me` once per load, redirects anonymous users to `/login?redirect=…`, and blocks pages whose `definePageMeta({ roles })` don't match.
3. **UI** — navigation items and action buttons are hidden by role, so people don't click into 403s.

Registration is open and always creates a `member`; only a super admin can promote to `admin` or `super_admin`.

---

## 3. Running it

```bash
docker compose up -d db      # or npm run db:start
npm install
npm run db:migrate
npm run db:seed              # prints demo accounts
npm run dev -- --port 3005   # http://localhost:3005
```

**Demo accounts** (created by the seed):

| Role | Email | Password |
|---|---|---|
| Super admin | `superadmin@library.local` | `Super12345` |
| Admin | `admin@library.local` | `Admin12345` |
| Member | `member@library.local` | `Member12345` |

Database: container `library-db`, host port **5434** (5433 belongs to another local Postgres). `DATABASE_URL=postgres://library:library@127.0.0.1:5434/library`.

---

## 4. Architecture

```
Browser (Nuxt SSR pages)
    │  httpOnly session cookie
Nitro middleware  ── resolves session → event.context.user
    │
Nitro routes (server/api/*)  ── requireUser / requireRole
    │  Drizzle
PostgreSQL 16 (users, sessions, books, copies, members, loans)
```

One deployable Node app, one database. No queue, no object storage, no background workers yet.

**Concurrency:** checkout/return run in `db.transaction` and take `SELECT … FOR UPDATE` on the copy row, so two desks cannot issue the same physical copy.

---

## 5. Data model

```mermaid
erDiagram
  USERS ||--o| MEMBERS : "library card"
  USERS ||--o{ SESSIONS : "has"
  BOOKS ||--o{ COPIES : "has physical"
  COPIES ||--o{ LOANS : "loaned as"
  MEMBERS ||--o{ LOANS : borrows
```

| Table | Columns |
|---|---|
| `users` | id, email (unique), name, password_hash, role, is_active, created_at |
| `sessions` | id (sha256 of token), user_id → users, expires_at, created_at |
| `members` | id, user_id → users (unique, nullable), member_no (unique), name, email, phone, joined_at, is_active |
| `books` | id, title, author, isbn, category, published_year, created_at |
| `copies` | id, book_id → books, barcode (unique), status `available \| on_loan` |
| `loans` | id, copy_id → copies, member_id → members, issued_at, due_at, returned_at, status `active \| returned` |

Key constraints:

```sql
CREATE UNIQUE INDEX loans_one_active_per_copy ON loans (copy_id) WHERE status = 'active';
CREATE INDEX loans_active_member ON loans (member_id) WHERE status = 'active';
```

Notes: authors are a text column (no join table yet); loan rules are constants, not a `membership_types` table; no branches, fines or reservations yet.

---

## 6. Auth design

| Concern | Decision |
|---|---|
| Password storage | `scrypt` with a 16-byte random salt, `scrypt:<salt>:<hash>`; compare with `timingSafeEqual` |
| Session token | 32 random bytes (base64url) in cookie `library_session`; DB stores only SHA-256 |
| Cookie flags | `httpOnly`, `SameSite=Lax`, `Secure` in production, 7-day expiry |
| Logout | Deletes the session row and clears the cookie |
| Disabled accounts | Rejected at login and on every request (session resolves to null) |
| Enumeration | Login returns the same "Invalid email or password" for unknown and wrong-password |
| Escalation | Role changes are super-admin only; no self-demotion/self-disable; last active super admin is protected |

Not yet: password reset, email verification, rate limiting, 2FA, session list/revoke UI.

---

## 7. Business rules

| Rule | Where |
|---|---|
| 14-day loan period | `server/api/loans/checkout.post.ts` |
| Max 5 active loans per member | checkout, same transaction |
| Member must exist and be active | checkout |
| Copy must exist and be `available` | checkout, under row lock |
| Copy must be on loan to return | return |
| One active loan per copy | partial unique index |
| Overdue = `due_at < now()` | computed at query time |

---

## 8. API

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create member account (+ library card) |
| POST | `/api/auth/login` | public | Start session |
| POST | `/api/auth/logout` | any | End session |
| GET | `/api/auth/me` | signed in | Current user |
| GET | `/api/stats` | staff | Counters |
| GET | `/api/books?q=` | signed in | Titles + availability |
| POST | `/api/books` | staff | Add title (+ copies) |
| GET | `/api/members` | staff | Members + loan counts |
| POST | `/api/members` | staff | Add member |
| GET | `/api/loans?status=&limit=` | staff | All loans |
| GET | `/api/loans/mine` | member | Own loans |
| POST | `/api/loans/checkout` | staff | `{ memberNo, barcode }` |
| POST | `/api/loans/return` | staff | `{ barcode }` |
| GET | `/api/admin/users` | super admin | All accounts |
| PATCH | `/api/admin/users/:id` | super admin | `{ role?, isActive? }` |

---

## 9. Project layout

```
app/
  app.vue, layouts/{default,auth}.vue
  composables/useAuth.ts        session state + role helpers
  middleware/auth.global.ts     redirect + page-role guard
  pages/                        index, catalog, members, circulation,
                                login, register, admin/users
  utils/format.ts
  assets/css/main.css
server/
  api/                          auth/, admin/, books, members, loans/, stats
  middleware/auth.ts            session → event.context.user
  utils/auth.ts                 hashing, sessions, requireUser/requireRole
  db/{schema,client}.ts
drizzle/                        migrations
scripts/seed.mjs
types/page-meta.d.ts            PageMeta.roles augmentation
```

---

## 10. Verification

Tested against the running app with seeded data:

- Anonymous `/` → **302** to `/login?redirect=/`; `/api/stats` → **401**.
- Login with each demo account returns the right role; wrong password → **401**.
- Member: `/api/loans/mine` → 200, `/api/members` → **403**, `POST /api/books` → **403**, `/members` → **302** to `/`.
- Admin: `/api/admin/users` → **403**.
- Super admin: users list → 200; promote a member to admin → 200; self-demotion → **400**.
- Register: new account gets `member` + `M006`; duplicate email → **409**; short password → **400**.
- Logout → `/api/auth/me` **401**.
- UI flows verified in a headless browser: sign-in redirect, role-aware sidebar, member dashboard, super-admin user table.

---

## 11. Deferred

| Area | Why deferred |
|---|---|
| Fines & payments | Needs policy: rate, grace days, cap, currency |
| Reservations / hold queue | Needs a member-facing request flow |
| Renewals | Depends on holds + limits config |
| Email (receipts, due reminders) | Needs a queue and templates |
| pg-boss jobs | Overdue is derived at query time today |
| Reports & audit log | Audit needs "who did what" — auth now makes this possible |
| Password reset / verification | Requires email |
| Rate limiting, 2FA, session management UI | Hardening before public exposure |
| Multi-branch, S3 covers, tests/CI, Docker deploy | Later phases |

---

## 12. Roadmap

### Phase 1 — Accounts ✅ (done)

Login, register, logout, roles, super-admin access management, server-side guards.

### Phase 2 — Hardening (≈2 days)

- Login rate limiting (per IP + per account) and password reset via email.
- Session list + revoke in `/admin/users`.
- Test suite: due-date/limit units, Playwright happy paths.
- Production build + Dockerfile.

### Phase 3 — Money (≈3–4 days)

- `fines` + `payments` tables; rate, grace, cap from settings.
- Mark fines on return; cash payment at the desk; member balance view.

### Phase 4 — Holds & self-service (≈4–5 days)

- Reservations with FIFO queue and hold-shelf expiry.
- Promote next hold on return.
- Email receipts and reminders (pg-boss + Resend).

### Phase 5 — Scale out (≈1 week)

- Multi-branch (branch_id on copies/loans/members).
- Reports: circulation, overdue list, popular titles, fines collected.
- Audit log, backups/monitoring, deploy pipeline.

---

## 13. Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-06 | Simple web version first | Fastest path to something usable |
| 2026-11-06 | Real PostgreSQL | Same stack as target system |
| 2026-11-06 | Hand-written CSS, no UI framework | Few screens; avoids a dependency |
| 2026-11-06 | DB-backed sessions + scrypt, no auth library | ~80 lines, no native deps, full control |
| 2026-11-06 | Open registration → `member` role only | Staff access must be granted by a super admin |
| 2026-11-06 | Super admin cannot demote/disable self; last super admin protected | Avoids locking everyone out |
| 2026-11-06 | Member accounts auto-create a library card | Lets staff lend to self-registered users |

### Still open

1. **Fines** — charge at all? Rate, grace days, cap, currency.
2. **Public catalog** — should anonymous visitors browse before signing up?
3. **Staff onboarding** — self-register + promote, or invite-only accounts?
4. **Hosting** — on-prem at the library vs. cloud (affects TLS, email, backups).
