import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { sessions, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token ?? '').trim()
  const password = String(body?.password ?? '')
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000)

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  const userId = await consumeEmailToken(token, 'reset_password')

  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId))

  // A reset ends every existing session — if the account was compromised,
  // the attacker loses access the moment the owner resets.
  await db.delete(sessions).where(eq(sessions.userId, userId))

  return { ok: true }
})
