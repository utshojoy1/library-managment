import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library'

// Reuse the pool across dev-server hot reloads instead of leaking connections.
const g = globalThis as typeof globalThis & {
  __libraryPool?: pg.Pool
  __libraryDb?: ReturnType<typeof drizzle>
}

export const pool =
  g.__libraryPool ?? (g.__libraryPool = new pg.Pool({ connectionString, max: 5 }))

export const db = g.__libraryDb ?? (g.__libraryDb = drizzle(pool))
