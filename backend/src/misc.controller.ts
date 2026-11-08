import { Controller, Get, NotFoundException } from '@nestjs/common'
import { desc, sql } from 'drizzle-orm'
import { db } from './db.js'
import { emails } from './schema.js'
import { DEV_INBOX } from './mail.js'
import { Public, Roles, STAFF } from './common.js'

@Controller()
export class MiscController {
  @Get('stats')
  @Roles(...STAFF)
  async stats() {
    const { rows } = await db.execute<Record<string, number>>(sql`
      select
        (select count(*)::int from books)   as books,
        (select count(*)::int from copies)  as copies,
        (select count(*)::int from members) as members,
        (select count(*)::int from loans where status = 'active') as active_loans,
        (select count(*)::int from loans where status = 'active' and due_at < now()) as overdue
    `)
    const r = rows[0]!
    return { books: r.books, copies: r.copies, members: r.members, activeLoans: r.active_loans, overdue: r.overdue }
  }

  /** Development inbox: what would have been emailed, including the links. */
  @Public()
  @Get('dev/outbox')
  outbox() {
    if (!DEV_INBOX) throw new NotFoundException()
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
  }
}
