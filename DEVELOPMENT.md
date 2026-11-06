# Developer Setup

Everything needed to run Libraria locally, from a clean machine.

## 1. Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 LTS or newer (tested on 24) | `node -v` |
| npm | 10+ | ships with Node; no pnpm/yarn needed |
| Docker Desktop | any recent | for the Postgres container |
| Git | any | |

No Docker? Use any PostgreSQL 16 server and point `DATABASE_URL` at it — skip step 3.

## 2. Clone and install

```bash
git clone https://github.com/utshojoy1/libery-managment.git
cd "libery-managment"        # the folder name has a space — quote it
npm install
```

## 3. Start PostgreSQL

```bash
docker compose up -d db
```

This maps container `5432` to **host 5434** and stores data in the `library-data` volume. Port 5434 is deliberate: many machines already have something on 5432/5433.

Check it:

```bash
docker ps --filter name=library-db
# library-db   postgres:16   Up ...   0.0.0.0:5434->5432/tcp
```

**If a container named `library-db` already exists** (e.g. started earlier with `npm run db:start`), Compose will refuse to create it. Either reuse it:

```bash
docker start library-db
```

or remove it and let Compose take over (this deletes its data if it had no volume):

```bash
docker rm -f library-db && docker compose up -d db
```

## 4. Environment

```bash
cp .env.example .env
```

The defaults match the Compose database, so no edit is needed for local work. `.env` is git-ignored.

> **Gotcha:** drizzle-kit does not load `.env` itself. If you change `DATABASE_URL` to something non-default, prefix the migration commands:
> `DATABASE_URL=postgres://… npm run db:migrate`

## 5. Create tables and demo data

```bash
npm run db:migrate    # applies drizzle/*.sql
npm run db:seed       # truncates and reloads demo data
```

Expected output:

```
Seeded: { books: '8', copies: '19', members: '5', users: '3', loans: '5' }
Sign in: superadmin@library.local / Super12345
```

## 6. Run it

```bash
npm run dev -- --port 3005
```

Open **<http://localhost:3005>** — note `localhost`, not `127.0.0.1`: the dev server binds to IPv6 `::1`, so a literal `127.0.0.1` URL may be refused.

### Sign in

| Role | Email | Password |
|---|---|---|
| Super admin | `superadmin@library.local` | `Super12345` |
| Admin | `admin@library.local` | `Admin12345` |
| Member | `member@library.local` | `Member12345` |

Seeded accounts are pre-verified. Register a new account to exercise the verification flow.

## 7. Emails while developing

No SMTP is configured by default. Every message (verification, reset) is stored in the `emails` table and shown at:

**<http://localhost:3005/dev/mail>**

The page lists each message with its clickable link. It returns 404 when `NODE_ENV=production`.

To send real email, put these in `.env` and restart:

```bash
SMTP_URL=smtp://user:password@smtp.example.com:587
MAIL_FROM="Libraria <no-reply@example.com>"
```

Delivery status (`queued` / `sent` / `failed`) is recorded per message either way.

## 8. Day-to-day commands

| Command | Purpose |
|---|---|
| `npm run dev -- --port 3005` | Dev server with HMR |
| `npm run db:seed` | **Wipe and reload** demo data |
| `npm run db:generate` | New SQL migration from `server/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:start` | Start the DB container without Compose |
| `npm run build` | Production build into `.output/` |
| `npm run preview` | Preview the production build |

## 9. Changing the database schema

The schema in `server/db/schema.ts` is the source of truth.

```bash
# 1. edit server/db/schema.ts
npm run db:generate     # writes drizzle/000N_*.sql (+ snapshot)
npm run db:migrate      # applies it
```

Rules:

- Never edit a migration that has already been applied — add a new one.
- Commit both the generated `.sql` and `drizzle/meta/*` files.
- Update `scripts/seed.mjs` when you add columns that demo data should populate.
- `npm run db:push` exists for throwaway experiments; prefer generate + migrate so the migration history stays honest.

## 10. Adding things

**API route** — create a file under `server/api/`. The filename defines method and path:

```
server/api/books.get.ts        GET  /api/books
server/api/books.post.ts       POST /api/books
server/api/loans/[id].delete.ts DELETE /api/loans/:id
```

Guard every non-public route:

```ts
export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)          // or requireUser(event)
  // …
})
```

**Page** — `app/pages/foo.vue` becomes `/foo`. Restrict by role:

```ts
definePageMeta({ roles: ['admin', 'super_admin'] })
```

**Server helper** — put it in `server/utils/`; Nitro auto-imports it (like `db`, `requireUser`, `sendMail`).

**Session user** — `useAuth()` in the frontend gives `user`, `role`, `isStaff`, `isSuperAdmin`.

## 11. Checking your work

```bash
# API smoke test: unauthenticated request must be rejected
curl -i http://localhost:3005/api/stats          # → 401

# Log in and call as staff
curl -c /tmp/jar -X POST http://localhost:3005/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@library.local","password":"Admin12345"}'
curl -b /tmp/jar http://localhost:3005/api/stats  # → 200 JSON
```

Inspect the database directly:

```bash
docker exec -it library-db psql -U library -d library
# \dt              list tables
# select * from users;
```

Server logs are in the terminal running `npm run dev`. Application errors print there; API errors also come back as `{ statusCode, statusMessage }`.

## 12. Common problems

| Symptom | Cause / fix |
|---|---|
| `EACCES`/`EPERM` under `~/.npm` during install | npm cache has root-owned files. Fix with `sudo chown -R $(id -u):$(id -g) ~/.npm`, or use a temp cache: `npm_config_cache=/tmp/npm-cache npm install` |
| `role "library" does not exist` | You reached a different Postgres (something already on 5433/5432). Confirm the container publishes **5434** and `DATABASE_URL` uses it |
| `docker compose up` says container name in use | An older `library-db` exists — `docker start library-db`, or remove it first |
| `curl` to `127.0.0.1:3005` refused but the app is up | Dev server binds `::1`; use `http://localhost:3005` |
| `npx drizzle-kit push` hangs | Interactive prompt. Use `npm run db:generate && npm run db:migrate` |
| Logged out after `npm run db:seed` | The seed truncates `sessions` too — sign in again |
| Emails never arrive | Expected without `SMTP_URL`; read them at `/dev/mail` |
| `500` from an endpoint | Check the dev terminal; often a missing table → run `npm run db:migrate` |

## 13. Production build (later)

```bash
npm run build
NODE_ENV=production \
DATABASE_URL=postgres://… \
SMTP_URL=smtp://… \
node .output/server/index.mjs
```

Before exposing it publicly:

- Change the seeded demo passwords or delete those accounts.
- Set `SMTP_URL` so verification and reset actually reach people.
- Serve over HTTPS (a proxy is fine) — session cookies are `Secure` in production only because of TLS.
- `/dev/mail` and `/api/dev/outbox` already 404 in production.
