import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library',
  max: 5,
})

export const db = drizzle(pool)

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
