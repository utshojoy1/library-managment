# Libraria — Library Management

A working library management web app: **Nuxt 4** (SSR) on **PostgreSQL 16**, with Drizzle ORM.

Catalog with physical copies, members, issue/return circulation, role-based accounts, email verification and password reset.

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

Guards are enforced server-side on every endpoint (`requireUser` / `requireRole`), not just in the UI.

## Screens

- **Login / Register** — split auth layout; sign-in links to password reset.
- **Forgot / Reset password** — email a single-use link, set a new password.
- **Verify email** — one-click confirmation from the emailed link.
- **Dashboard** — staff see library counts and all active loans; members see their own loans.
- **Catalog** — searchable with availability; staff can add titles (copies get barcodes).
- **Members** — staff only; outstanding-loan counts; add members.
- **Circulation** — staff only; check out by member number + barcode, return by barcode.
- **Users & access** — super admin only; promote/demote, disable access.
- **Dev inbox** (`/dev/mail`) — development only; every outgoing email with its link.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Nuxt 4 (Vue 3, Nitro server routes) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | Cookie sessions (httpOnly), scrypt hashing, DB-backed sessions + tokens |
| Mail | SMTP via nodemailer when `SMTP_URL` is set; outbox otherwise |
| Styling | Hand-written CSS (no UI framework) |

## Quick start

```bash
# 1. Database (Docker). Host port 5434 avoids clashing with a local Postgres.
docker compose up -d db

# 2. Install
npm install

# 3. Tables + demo data (prints the demo accounts)
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev -- --port 3005
```

Open <http://localhost:3005>. Without SMTP configured, verification and reset emails are captured in the **dev inbox** at `/dev/mail` (linked from the auth screens).

Already have a Postgres? Point `DATABASE_URL` (see `.env`) at it and skip step 1.

## Email configuration

Out of the box nothing is sent: every message is written to the `emails` table and shown in `/dev/mail`.

To deliver real mail, set:

```bash
SMTP_URL=smtp://user:password@smtp.example.com:587
MAIL_FROM="Libraria <no-reply@example.com>"
```

and restart. Delivery status (`queued` / `sent` / `failed`) is recorded per message in the outbox.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server |
| `npm run build` / `preview` | Production build and preview |
| `npm run db:generate` | Generate a SQL migration from `server/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Reset and load demo data (books, copies, members, users, loans) |
| `npm run db:start` | Start the Docker Postgres container |

## Project layout

```
app/
  assets/css/main.css        design system (tokens, layout, components)
  composables/useAuth.ts     session user state, role helpers
  middleware/auth.global.ts  redirects anonymous users, enforces page roles
  layouts/default.vue        sidebar shell, user box, unverified banner
  layouts/auth.vue           centered card for the account screens
  pages/
    index, catalog, members, circulation
    login, register, forgot-password, reset-password, verify-email
    admin/users, dev/mail
  utils/format.ts
server/
  api/                       auth/, admin/, dev/, books, members, loans, stats
  db/schema.ts               Drizzle schema
  db/client.ts               pg pool + Drizzle client
  middleware/auth.ts         resolves the session per request
  utils/auth.ts              hashing, sessions, requireUser/requireRole
  utils/tokens.ts            single-use email tokens
  utils/mailer.ts            SMTP + outbox transport, templates
  utils/rate-limit.ts        in-memory limiter
drizzle/                     generated SQL migrations
scripts/seed.mjs             demo data + demo accounts
```

## Auth model

- **Passwords**: scrypt (`scrypt:<salt>:<hash>`), compared with `timingSafeEqual`.
- **Sessions**: random token in an httpOnly, SameSite=Lax cookie; only its SHA-256 is stored. 7-day lifetime.
- **Email verification**: 24-hour single-use token; unverified users can sign in but see a resend banner.
- **Password reset**: 1-hour single-use token. Resetting revokes *all* sessions for that account.
- **No account enumeration**: login says "Invalid email or password"; forgot-password always returns OK.
- **Rate limits**: 3 verification resends / 10 min, 3 resets per email address / 15 min, 10 reset attempts per IP / 15 min.
- **Privileges**: only a super admin changes roles; you cannot demote or disable yourself; the last active super admin is protected.

## Data model

- `users` — account, role (`super_admin | admin | member`), active flag, `email_verified_at`.
- `sessions` — hashed session token, user, expiry.
- `email_tokens` — hashed single-use tokens (`verify_email`, `reset_password`), expiry, used flag.
- `emails` — outbox of every message and its delivery status.
- `members` — borrower record; optionally linked to a user (`user_id`) so self-registered accounts can see their loans.
- `books` / `copies` — titles and physical items (unique barcode, `available | on_loan`).
- `loans` — issue/return history; partial unique index guarantees one active loan per copy.

## API

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create member account (+ library card), send verification |
| POST | `/api/auth/login` | public | Start a session |
| POST | `/api/auth/logout` | any | End the session |
| GET | `/api/auth/me` | signed in | Current user |
| POST | `/api/auth/verify-email` | public | `{ token }` — confirm email |
| POST | `/api/auth/resend-verification` | signed in | Re-send the confirmation link |
| POST | `/api/auth/forgot-password` | public | `{ email }` — always 200 |
| POST | `/api/auth/reset-password` | public | `{ token, password }` |
| GET | `/api/dev/outbox` | dev only | Recent messages (404 in production) |
| GET | `/api/stats` | staff | Dashboard counters |
| GET | `/api/books?q=` | signed in | Books with total/available copies |
| POST | `/api/books` | staff | Create title (+ copies, auto barcodes) |
| GET | `/api/members` | staff | Members with active-loan counts |
| POST | `/api/members` | staff | Create a member |
| GET | `/api/loans?status=&limit=` | staff | All loans |
| GET | `/api/loans/mine` | member | The signed-in member's loans |
| POST | `/api/loans/checkout` | staff | `{ memberNo, barcode }` |
| POST | `/api/loans/return` | staff | `{ barcode }` |
| GET | `/api/admin/users` | super admin | All accounts |
| PATCH | `/api/admin/users/:id` | super admin | `{ role?, isActive? }` |

## Notes

- Checkout locks the copy row (`SELECT … FOR UPDATE`), so two desks can't issue the same book.
- Barcodes and member numbers are normalized to uppercase everywhere (`b0002-1` → `B0002-1`), so typing case never matters.
- Errors return `{ statusCode, statusMessage }`; the UI shows `statusMessage`.
- `.env` is git-ignored; committed defaults assume the Docker database on port 5434.
- The dev inbox is disabled when `NODE_ENV=production` and must not be exposed publicly.
- Not yet implemented: login rate limiting, session list/revoke UI, 2FA, invite-only staff accounts.
