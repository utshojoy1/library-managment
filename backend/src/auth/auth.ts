import { BadRequestException } from '@nestjs/common'
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { and, eq, gt, isNull, lt } from 'drizzle-orm'
import type { Response } from 'express'
import { db, type Tx } from '../db.js'
import { emailTokens, sessions, users } from '../schema.js'
import type { Role, SessionUser } from '../common.js'

export const SESSION_COOKIE = 'library_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Email links point at the frontend; never build them from the request's Host header. */
export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

// Async so hashing doesn't block every other request.
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>

/** Password hashes are `scrypt:<salt-hex>:<hash-hex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = await scryptAsync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function randomToken(): string {
  return randomBytes(32).toString('base64url')
}

export function publicUser(user: {
  id: number
  email: string
  name: string
  role: string
  emailVerifiedAt: Date | null
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

export async function createSession(res: Response, userId: number) {
  const token = randomToken()
  // Expired sessions are only otherwise removed when reused; sweep them here.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS,
  })
}

export async function destroySession(token: string | undefined, res: Response) {
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)))
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null

  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)))
    .limit(1)

  if (!row || row.expiresAt < new Date() || !row.user.isActive) return null
  return publicUser(row.user)
}

export type EmailTokenPurpose = 'verify_email' | 'reset_password'

const TOKEN_TTL_MINUTES: Record<EmailTokenPurpose, number> = {
  verify_email: 24 * 60,
  reset_password: 60,
}

/**
 * Issues a single-use token and returns the raw value. The database only sees
 * its SHA-256, and earlier unused tokens for the same purpose stop working.
 */
export async function issueEmailToken(userId: number, purpose: EmailTokenPurpose): Promise<string> {
  await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose), isNull(emailTokens.usedAt)))

  const token = randomToken()
  await db.insert(emailTokens).values({
    userId,
    purpose,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES[purpose] * 60_000),
  })
  return token
}

/** Marks the token used in one statement, so two concurrent requests can't both redeem it. */
export async function consumeEmailToken(token: string, purpose: EmailTokenPurpose, tx: Tx | typeof db = db) {
  const [row] = token
    ? await tx
        .update(emailTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(emailTokens.tokenHash, sha256(token)),
            eq(emailTokens.purpose, purpose),
            isNull(emailTokens.usedAt),
            gt(emailTokens.expiresAt, new Date()),
          ),
        )
        .returning({ userId: emailTokens.userId })
    : []

  if (!row) throw new BadRequestException('This link is invalid or has expired. Request a new one.')
  return row.userId
}
