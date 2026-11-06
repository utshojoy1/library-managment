import { desc } from 'drizzle-orm'
import { db } from '../../db/client'
import { emails } from '../../db/schema'

/**
 * Development inbox: what would have been emailed, including the links.
 * Never available in production.
 */
export default defineEventHandler(async () => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return db
    .select({
      id: emails.id,
      to: emails.to,
      subject: emails.subject,
      text: emails.text,
      status: emails.status,
      createdAt: emails.createdAt,
    })
    .from(emails)
    .orderBy(desc(emails.id))
    .limit(25)
})
