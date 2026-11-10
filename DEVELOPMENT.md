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

The defaults match the Compose database. The API, the TypeORM CLI and the seed script all read `backend/.env`. The frontend needs no env file locally.

## 5. Create tables and demo data

```bash
npm run db:migrate    # builds the API, then applies backend/src/migrations/*
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

The entities (`backend/src/<feature>/*.entity.ts`) describe the schema; migrations change it. `synchronize` is off, so the database only changes through migrations.

```bash
# 1. edit an entity (or add one: a new *.entity.ts is picked up automatically)
npm run db:generate -- backend/src/migrations/AddFines   # diff entities vs the DB
npm run db:migrate                                                  # applies it
```

- Read the generated migration before applying it.
- Never edit an applied migration — add a new one. `npm run db:revert -w backend` undoes the last one.
- `Baseline` recreates the schema the earlier Drizzle migrations built; on a database that already has it, it only records itself.
- Update `backend/scripts/seed.mjs` when demo data should fill new columns.

## 10. Adding things

**API route** — add a method to a feature's controller and put the logic in its service. A new feature gets its own folder (`backend/src/fines/`: `fines.module.ts`, `.controller.ts`, `.service.ts`, `.entity.ts`, `dto/`), and its module is imported in `app.module.ts`. Routes need a session by default:

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

Type request bodies and query strings as DTO classes with `class-validator` rules; the global `ValidationPipe` rejects anything else with a 400 and strips unknown fields. `common/transforms.ts` has `@Trim()`, `@ToLowerCase()`, `@ToUpperCase()` (barcodes, member numbers) and `@ToOptionalNumber()` (HTML number inputs). Services throw Nest exceptions (`NotFoundException`, `ConflictException`, …) for errors, and inject repositories with `@InjectRepository(Entity)` after the module lists the entity in `TypeOrmModule.forFeature([...])`.

**Page** — `frontend/src/app/dashboard/foo/page.tsx` becomes `/dashboard/foo` inside the sidebar layout. The frontend follows the "project files outside of `app`" strategy from the Next.js project-structure guide: `src/app/` holds only routing files, and everything else lives in `src/components`, `src/actions` and `src/lib`. Pages are Server Components: start with `await verifySession()` (any signed-in user) or `await requireRole(STAFF)` from `@/lib/dal`, then load data with `await api<T>('/path')` from `@/lib/api`. Guard the API too; it is the real boundary.

```
src/app/dashboard/fines/page.tsx  server: requireRole, api('/fines'), render
src/actions/fines.ts                'use server': forward the form to the API, revalidatePath('/fines')
src/components/fines/fine-form.tsx  'use client': useActionState(action, {}) for pending + error state
```

Server Actions return `{ error }` for API refusals (`formError(e)`) and call `revalidatePath` so the page re-renders with fresh data. Keep form inputs controlled: React resets uncontrolled fields after an action, which would wipe a form that just failed validation. Only client components that need state or events get `'use client'`; pass them server data as props. A new public page (no sign-in) must also be added to `PUBLIC_PATHS` in `frontend/src/proxy.ts`.

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
- Set `BACKEND_URL` on the frontend server if the API isn't on `localhost:4000`. It is read at runtime, server-side only.
- Put a reverse proxy (nginx, Caddy) in front of Next.js that sets the client IP (`proxy_set_header X-Forwarded-For $remote_addr;`), and set `TRUST_PROXY=loopback` on the API. That turns on per-IP rate limits; without it only per-email/per-account limits apply.
- Change the seeded demo passwords or delete those accounts.
- Serve over HTTPS — session cookies are `Secure` in production.
- Run a single API process (the rate limiter is in memory), or move the limiter to shared storage first.
