import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  rateLimit(`resend-verification:${user.id}`, 3, 10 * 60 * 1000)

  const [row] = await db
    .select({ email: users.email, name: users.name, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  if (row.emailVerifiedAt) {
    throw createError({ statusCode: 400, statusMessage: 'This email is already verified' })
  }

  const token = await issueEmailToken(user.id, 'verify_email')
  const link = `${appBaseUrl(event)}/verify-email?token=${token}`
  await sendMail({ to: row.email, ...verifyEmailMessage(row.name, link) })

  return { ok: true, email: row.email }
})
