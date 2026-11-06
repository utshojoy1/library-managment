import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'

export const SESSION_COOKIE = 'library_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type Role = 'super_admin' | 'admin' | 'member'
export const ROLES: Role[] = ['super_admin', 'admin', 'member']

export type SessionUser = {
  id: number
  email: string
  name: string
  role: Role
  emailVerified: boolean
}

type UserRow = {
  id: number
  email: string
  name: string
  role: string
  emailVerifiedAt: Date | null
}

/** Password hashes are `scrypt:<salt-hex>:<hash-hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url')
}

export function publicUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

export async function createSession(event: H3Event, userId: number) {
  const token = randomToken()
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)))
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const id = sha256(token)
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1)

  if (!row) return null
  if (new Date(row.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, id))
    return null
  }
  if (!row.user.isActive) return null

  return publicUser(row.user)
}

export function requireUser(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Please sign in to continue' })
  return user
}

export function requireRole(event: H3Event, roles: Role[]): SessionUser {
  const user = requireUser(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission to do that' })
  }
  return user
}

export const STAFF: Role[] = ['admin', 'super_admin']
