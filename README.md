# Libraria — Library Management

A library management web app: **Next.js** frontend, **NestJS** API, **PostgreSQL 16** with TypeORM.

Catalog with physical copies, members, issue/return circulation, role-based accounts, email verification and password reset.

## Quick start

```bash
docker compose up -d db                 # Postgres on host port 5434
npm install                             # installs backend + frontend (npm workspaces)
cp backend/.env.example backend/.env
npm run db:migrate
npm run db:seed                         # demo data + accounts
npm run dev                             # API :4000 + web :3000
```

Open <http://localhost:3000>. Without SMTP configured, verification and reset emails are captured in the **dev inbox** at `/dev/mail`.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super admin | `superadmin@library.local` | `Super12345` |
| Admin | `admin@library.local` | `Admin12345` |
| Member | `member@library.local` | `Member12345` |

Created by `npm run db:seed` and pre-verified. Registration is open — new sign-ups get the **member** role and must verify their email.

## Roles

| Capability | Member | Admin | Super admin |
|---|:--:|:--:|:--:|
| Browse catalog | ✓ | ✓ | ✓ |
| See own loans | ✓ | — | — |
| Add books / copies | — | ✓ | ✓ |
| Manage members | — | ✓ | ✓ |
| Issue / return books | — | ✓ | ✓ |
| Manage user roles & access | — | — | ✓ |

The API denies by default: a global NestJS guard requires a session on every route unless it is marked `@Public()`, and `@Roles()` narrows it. The frontend only hides and redirects.

## Architecture

```
Browser ──► Next.js (:3000)  Server Components + Server Actions ──► NestJS (:4000)  /api
                                                              │
                                                              └─► PostgreSQL (TypeORM)
```

The browser only talks to Next.js. Pages render on the Next.js server, which calls the API with the user's session cookie; forms post to Server Actions that do the same. The httpOnly cookie stays first-party, no CORS is needed, and the API is never exposed to the browser.

## Scripts (run from the repo root)

| Script | What it does |
| --- | --- |
| `npm run dev` | Backend (watch) + frontend (HMR) together; Ctrl+C stops both |
| `npm run build` / `npm start` | Production build, then run both built apps |
| `npm test` | API tests against a running, freshly seeded backend |
| `npm run db:generate -- backend/src/database/migrations/<Name>` | Migration from the entity changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:revert -w backend` | Undo the last migration |
| `npm run db:seed` | **Wipe** and load demo data |
| `npm run db:start` | Start the Docker Postgres |

Each workspace also runs on its own: `npm run dev -w backend`, `npm run dev -w frontend`.

## Project layout

```
backend/                     NestJS API
  src/main.ts                bootstrap: cookie parser, /api prefix, global ValidationPipe
  src/app.module.ts          root module: TypeORM connection + feature modules
  src/<feature>/             one Nest module per feature: *.module, *.controller, *.service, *.entity, dto/
    auth/                    login, register, email links; sessions + email-token services; global AuthGuard
    users/                   super-admin user management (/admin/users)
    members/ books/ loans/   library cards, catalog + copies, checkout/return
    stats/                   dashboard counts
    mail/                    SMTP + outbox, email templates, dev outbox
  src/common/                roles, decorators (@Public, @Roles, @CurrentUser), DTO transforms, rate limiter
  src/database/              data-source.ts (app + CLI) and migrations/
  scripts/seed.mjs           demo data
  test/api.test.mjs          API tests (node:test)
frontend/                    Next.js App Router
  app/(app)/                 signed-in pages + sidebar layout (dashboard, catalog, members, circulation, admin/users)
  app/(auth)/                login, register, forgot/reset password, verify email
  app/dev/mail/              dev inbox
  app/<route>/_components/   client components for that route (forms, search); pages stay Server Components
  app/<route>/actions.ts     Server Actions for that route's forms
  lib/api.ts                 server-only API client (forwards the session cookie)
  lib/dal.ts                 data access layer: getUser, verifySession, requireRole
  lib/types.ts, format.ts    API types; date and code formatting
  proxy.ts                   optimistic redirect to /login when there is no session cookie
scripts/dev.mjs              runs both apps for `npm run dev` / `npm start`
```

## Configuration (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgres://library:library@127.0.0.1:5434/library` | Postgres |
| `APP_URL` | `http://localhost:3000` | Base of links in emails — **set this in production** |
| `PORT` | `4000` | API port |
| `SMTP_URL`, `MAIL_FROM` | — | Real email delivery; without them mail stays in the outbox |
| `TRUST_PROXY` | unset | Set (e.g. `loopback`) only when a front proxy like nginx writes the client IP into `X-Forwarded-For`; turns on per-IP rate limits |

Frontend: `BACKEND_URL` (default `http://localhost:4000`), the API the Next.js server calls. Read at runtime; never sent to the browser.

## Auth model

- **Passwords**: scrypt (`scrypt:<salt>:<hash>`), async, compared with `timingSafeEqual`.
- **Sessions**: random token in an httpOnly, SameSite=Lax cookie; only its SHA-256 is stored. 7-day lifetime.
- **Email verification**: 24-hour single-use token; unverified users can sign in but see a resend banner.
- **Password reset**: 1-hour single-use token, redeemed atomically. Resetting revokes *all* sessions for that account.
- **Email links** are built from `APP_URL`, never from the request's `Host` header.
- **No account enumeration**: login says "Invalid email or password"; forgot-password always returns OK.
- **Rate limits** (in memory, single process): login 10/email per 15 min; 3 verification resends / 10 min; 3 reset emails per address / 15 min. With `TRUST_PROXY` set, also per IP: login 20, reset requests 10, reset attempts 10 per 15 min. (Requests reach the API from the Next.js server, which doesn't pass the client IP, so per-IP limits stay off without a front proxy — otherwise all users would share one bucket, or spoof their way around it.)
- **Privileges**: only a super admin changes roles; you cannot demote or disable yourself; the last active super admin is protected (row-locked, race-safe).

## Data model

- `users` — account, role (`super_admin | admin | member`), active flag, `email_verified_at`.
- `sessions` — hashed session token, user, expiry.
- `email_tokens` — hashed single-use tokens (`verify_email`, `reset_password`), expiry, used flag.
- `emails` — outbox of every message and its delivery status.
- `members` — borrower record; optionally linked to a user so self-registered accounts can see their loans.
- `books` / `copies` — titles and physical items (unique barcode, `available | on_loan`).
- `loans` — issue/return history; partial unique index guarantees one active loan per copy.

## API

All routes are under `/api`. Errors return `{ statusCode, message }`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create member account (+ library card), send verification |
| POST | `/auth/login` | public | Start a session |
| POST | `/auth/logout` | public | End the session |
| GET | `/auth/me` | signed in | Current user |
| POST | `/auth/verify-email` | public | `{ token }` — confirm email |
| POST | `/auth/resend-verification` | signed in | Re-send the confirmation link |
| POST | `/auth/forgot-password` | public | `{ email }` — always 200 |
| POST | `/auth/reset-password` | public | `{ token, password }` |
| GET | `/dev/outbox` | dev only | Recent messages (404 in production or when SMTP is set) |
| GET | `/stats` | staff | Dashboard counters |
| GET | `/books?q=` | signed in | Books with availability and copy barcodes |
| POST | `/books` | staff | Create title (+ copies, auto barcodes) |
| GET | `/members` | staff | Members with active-loan counts |
| POST | `/members` | staff | Create a member |
| GET | `/loans?status=&limit=` | staff | All loans |
| GET | `/loans/mine` | signed in | The signed-in member's loans |
| POST | `/loans/checkout` | staff | `{ memberNo, barcode }` |
| POST | `/loans/return` | staff | `{ barcode }` |
| GET | `/admin/users` | super admin | All accounts |
| PATCH | `/admin/users/:id` | super admin | `{ role?, isActive? }` |

## Notes

- Checkout locks the copy **and** the member row, so two desks can't issue the same book or push a member past 5 loans.
- Barcodes and member numbers are normalized to uppercase everywhere (`b0002-1` → `B0002-1`).
- Not yet implemented: session list/revoke UI, 2FA, invite-only staff accounts. The rate limiter is per process.
