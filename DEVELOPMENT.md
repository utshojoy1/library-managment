# Developer Setup

Everything needed to run Libraria locally, from a clean machine.

## 1. Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.9 or newer (tested on 24) | `node -v`; scripts use `--env-file-if-exists` |
| npm | 10+ | workspaces install both apps at once |
| Docker Desktop | any recent | for the Postgres container |
| Git | any | |

No Docker? Use any PostgreSQL 16 server and point `DATABASE_URL` at it — skip step 3.

## 2. Clone and install

```bash
git clone https://github.com/utshojoy1/libery-managment.git
cd libery-managment
npm install          # root + backend + frontend
```

## 3. Start PostgreSQL

```bash
docker compose up -d db
```

This maps container `5432` to **host 5434** and stores data in the `library-data` volume.

If a container named `library-db` already exists, reuse it with `docker start library-db`, or remove it first: `docker rm -f library-db && docker compose up -d db`.

## 4. Environment

```bash
cp backend/.env.example backend/.env
```

The defaults match the Compose database. The API, drizzle-kit and the seed script all read `backend/.env`. The frontend needs no env file locally.

## 5. Create tables and demo data

```bash
npm run db:migrate    # applies backend/drizzle/*.sql
npm run db:seed       # truncates and reloads demo data
```

## 6. Run it

```bash
npm run dev
```

This starts the NestJS API on **:4000** (restarts on save) and Next.js on **:3000** (hot reload). Open **<http://localhost:3000>**. Ctrl+C stops both.

Prefer separate terminals? `npm run dev -w backend` and `npm run dev -w frontend`.

Seeded accounts (pre-verified): `superadmin@library.local / Super12345`, `admin@library.local / Admin12345`, `member@library.local / Member12345`.

## 7. Emails while developing

Without `SMTP_URL`, every message is stored in the `emails` table and shown at **<http://localhost:3000/dev/mail>** with clickable links. The outbox API returns 404 when `NODE_ENV=production` or when `SMTP_URL` is set.

To send real email, add to `backend/.env` and restart:

```bash
SMTP_URL=smtp://user:password@smtp.example.com:587
MAIL_FROM="Libraria <no-reply@example.com>"
```

## 8. Tests

```bash
npm run db:seed && npm run dev     # terminal 1
npm test                           # terminal 2
```

`backend/test/api.test.mjs` uses Node's built-in test runner against the live API: role guards, single-use reset tokens under concurrent redemption, and the 5-loan limit under concurrent checkouts. The tests add rows; re-seed afterwards for clean demo data.

## 9. Changing the database schema

`backend/src/schema.ts` is the source of truth.

```bash
# 1. edit backend/src/schema.ts
npm run db:generate     # writes backend/drizzle/000N_*.sql (+ snapshot)
npm run db:migrate      # applies it
```

- Never edit an applied migration — add a new one.
- Commit both the `.sql` and `drizzle/meta/*` files.
- Update `backend/scripts/seed.mjs` when demo data should fill new columns.

## 10. Adding things

**API route** — add a method to a controller in `backend/src/` (or a new controller, registered in `main.ts`). Routes need a session by default:

```ts
@Controller('fines')
@Roles(...STAFF)                 // whole controller: staff only
export class FinesController {
  @Get() list() { … }

  @Public()                      // opt out of auth for one route
  @Get('rates') rates() { … }

  @Get('mine')                   // any signed-in user
  mine(@CurrentUser() user: SessionUser) { … }
}
```

Use `str()` / `normalizeCode()` from `common.ts` on body fields and throw Nest exceptions (`BadRequestException`, …) for errors.

**Page** — `frontend/app/(app)/foo/page.tsx` becomes `/foo` inside the sidebar layout. To restrict it by role, add it to `PAGE_ROLES` in `frontend/app/(app)/layout.tsx` (and guard the API, which is the real boundary). Fetch with `useApi('/path')`, write with `api('/path', { method, body })`.

## 11. Common problems

| Symptom | Cause / fix |
|---|---|
| `role "library" does not exist` | You reached a different Postgres. Confirm the container publishes **5434** and `DATABASE_URL` uses it |
| Frontend shows "Something went wrong" everywhere | The API isn't running on :4000 — check the `npm run dev` output |
| Logged out after `npm run db:seed` | The seed truncates `sessions` — sign in again |
| Emails never arrive | Expected without `SMTP_URL`; read them at `/dev/mail` |
| Email links point at the wrong host | Set `APP_URL` in `backend/.env` |

## 12. Production

```bash
npm run build
NODE_ENV=production npm start      # API :4000 + web :3000
```

Before exposing it publicly:

- Set `APP_URL` to the public URL, plus `DATABASE_URL`, `SMTP_URL` and `MAIL_FROM`.
- Build the frontend with `BACKEND_URL` set if the API isn't on `localhost:4000`.
- Put a reverse proxy (nginx, Caddy) in front of Next.js that sets the client IP (`proxy_set_header X-Forwarded-For $remote_addr;`), and set `TRUST_PROXY=loopback` on the API. That turns on per-IP rate limits; without it only per-email/per-account limits apply.
- Change the seeded demo passwords or delete those accounts.
- Serve over HTTPS — session cookies are `Secure` in production.
- Run a single API process (the rate limiter is in memory), or move the limiter to shared storage first.
