import { and, eq, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db } from '../db/client'
import { emailTokens, users } from '../db/schema'

export type EmailTokenPurpose = 'verify_email' | 'reset_password'

const TOKEN_TTL_MINUTES: Record<EmailTokenPurpose, number> = {
  verify_email: 24 * 60,
  reset_password: 60,
}

/**
 * Issues a single-use token and returns the raw value. The database only ever
 * sees its SHA-256 hash, and any earlier unused token for the same purpose is
 * invalidated so a stale email cannot be replayed.
 */
export async function issueEmailToken(userId: number, purpose: EmailTokenPurpose): Promise<string> {
  await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.userId, userId),
        eq(emailTokens.purpose, purpose),
        isNull(emailTokens.usedAt),
      ),
    )

  const token = randomToken()
  await db.insert(emailTokens).values({
    userId,
    purpose,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES[purpose] * 60_000),
  })
  return token
}

export async function consumeEmailToken(token: string, purpose: EmailTokenPurpose): Promise<number> {
  if (!token) throw invalidLink()

  const [row] = await db
    .select()
    .from(emailTokens)
    .where(eq(emailTokens.tokenHash, sha256(token)))
    .limit(1)

  if (!row || row.purpose !== purpose || row.usedAt || new Date(row.expiresAt) < new Date()) {
    throw invalidLink()
  }

  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id))
  return row.userId
}

export async function markEmailVerified(userId: number) {
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId))
}

export function appBaseUrl(event: H3Event): string {
  return getRequestURL(event).origin
}

function invalidLink() {
  return createError({
    statusCode: 400,
    statusMessage: 'This link is invalid or has expired. Request a new one.',
  })
}
