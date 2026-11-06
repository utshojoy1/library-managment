import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  // Same message for unknown email and wrong password — no account enumeration.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }
  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'This account has been disabled' })
  }

  await createSession(event, user.id)
  return publicUser(user)
})
