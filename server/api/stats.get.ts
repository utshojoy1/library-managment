import { sql } from 'drizzle-orm'
import { db } from '../db/client'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

  const { rows } = await db.execute(sql`
    select
      (select count(*)::int from books)                as books,
      (select count(*)::int from copies)               as copies,
      (select count(*)::int from members)              as members,
      (select count(*)::int from loans where status = 'active') as active_loans,
      (select count(*)::int from loans
        where status = 'active' and due_at < now())    as overdue
  `)
  const r = rows[0] as Record<string, number>
  return {
    books: r.books,
    copies: r.copies,
    members: r.members,
    activeLoans: r.active_loans,
    overdue: r.overdue,
  }
})
