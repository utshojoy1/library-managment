import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

/**
 * Always answers 200 — never reveal whether an address has an account.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  rateLimit(`forgot-password:${email}`, 3, 15 * 60 * 1000)
  rateLimit(`forgot-password-ip:${ip}`, 10, 15 * 60 * 1000)

  if (email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (user && user.isActive) {
      try {
        const token = await issueEmailToken(user.id, 'reset_password')
        const link = `${appBaseUrl(event)}/reset-password?token=${token}`
        await sendMail({ to: user.email, ...resetPasswordMessage(user.name, link) })
      } catch (mailError) {
        console.error('[forgot-password] email failed', mailError)
      }
    }
  }

  return { ok: true }
})
