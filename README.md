# Libraria — Library Management

A working library management web app: **Nuxt 4** (SSR) on **PostgreSQL 16**, with Drizzle ORM.

Catalog with physical copies, members, issue/return circulation, and role-based accounts.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super admin | `superadmin@library.local` | `Super12345` |
| Admin | `admin@library.local` | `Admin12345` |
| Member | `member@library.local` | `Member12345` |

Created by `npm run db:seed`. Registration is open — new sign-ups get the **member** role.

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

- **Login / Register** — split auth layout, no sidebar.
- **Dashboard** — staff see library counts and all active loans; members see their own loans and due dates.
- **Catalog** — searchable book list with availability; staff can add titles (copies get barcodes automatically).
- **Members** — staff only; outstanding-loan counts; add members.
- **Circulation** — staff only; check out by member number + barcode, return by barcode.
- **Users & access** — super admin only; promote/demote accounts, disable access.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Nuxt 4 (Vue 3, Nitro server routes) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | Cookie sessions (httpOnly), scrypt password hashing, DB-backed sessions |
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

Open <http://localhost:3005> — you'll be redirected to `/login`.

Already have a Postgres? Point `DATABASE_URL` (see `.env`) at it and skip step 1.

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
  assets/css/main.css      design system (tokens, layout, components)
  composables/useAuth.ts   session user state, role helpers
  middleware/auth.global.ts  redirects anonymous users, enforces page roles
  layouts/default.vue      sidebar shell with user box + sign out
  layouts/auth.vue         centered card for login/register
  pages/                   index, catalog, members, circulation, login, register, admin/users
  utils/format.ts          date + error helpers
server/
  api/                     auth/, admin/, books, members, loans, stats
  db/schema.ts             Drizzle schema
  db/client.ts             pg pool + Drizzle client
  middleware/auth.ts       resolves the session per request
  utils/auth.ts            hashing, sessions, requireUser/requireRole
drizzle/                   generated SQL migrations
scripts/seed.mjs           demo data + demo accounts
```

## Auth model

- Passwords: **scrypt** (`scrypt:<salt>:<hash>`), verified with `timingSafeEqual`.
- Sessions: random 32-byte token in an httpOnly, SameSite=Lax cookie; only its SHA-256 is stored in `sessions`.
- Lifetime: 7 days; logout deletes the row and clears the cookie.
- Disabled accounts are rejected at login and on every subsequent request.
- Only a super admin can change roles. You cannot demote or disable yourself, and the last active super admin cannot be removed.

## Data model

- `users` — account, role (`super_admin | admin | member`), active flag.
- `sessions` — hashed token, user, expiry.
- `members` — borrower record; optionally linked to a user (`user_id`) so self-registered accounts can see their own loans.
- `books` — title-level records.
- `copies` — physical items, unique barcode, `available | on_loan`.
- `loans` — issue/return history; partial unique index guarantees one active loan per copy.

## API

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create a member account |
| POST | `/api/auth/login` | public | Start a session |
| POST | `/api/auth/logout` | any | End the session |
| GET | `/api/auth/me` | signed in | Current user |
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
- Errors return `{ statusCode, statusMessage }`; the UI shows `statusMessage`.
- `.env` is git-ignored; committed defaults assume the Docker database on port 5434.
- Not yet implemented: password reset, email verification, login rate limiting, 2FA.
