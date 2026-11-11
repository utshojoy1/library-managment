import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@Injectable()
export class StatsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async summary() {
    const [r] = await this.dataSource.query<Record<string, number>[]>(`
      select
        (select count(*)::int from books)   as books,
        (select count(*)::int from copies)  as copies,
        (select count(*)::int from members) as members,
        (select count(*)::int from loans where status = 'active') as active_loans,
        (select count(*)::int from loans where status = 'active' and due_at < now()) as overdue,
        (select count(*)::int from loans where status = 'active' and due_at >= now() and due_at < now() + interval '3 days') as due_soon
    `)
    const categories = await this.dataSource.query<{ name: string; count: number }[]>(`
      select coalesce(nullif(trim(category), ''), 'Uncategorized') as name, count(*)::int as count
      from books group by 1 order by 2 desc, 1
    `)
    return {
      books: r!.books,
      copies: r!.copies,
      members: r!.members,
      activeLoans: r!.active_loans,
      overdue: r!.overdue,
      dueSoon: r!.due_soon,
      categories,
    }
  }

  /**
   * Recent entries from the activity log, newest first. `bookId`/`memberId` are null once
   * that book or member is deleted (FK on delete set null); names come from the logged snapshot.
   */
  activity(limit = 12, booksOnly = false) {
    return this.dataSource.query<
      { type: string; at: string; subject: string; detail: string | null; actor: string | null; bookId: number | null; memberId: number | null }[]
    >(
      `
      select a.action as type, a.at, a.subject, a.detail,
             coalesce(u.name, a.actor_name) as actor,
             a.book_id as "bookId", a.member_id as "memberId"
        from activity_logs a
        left join users u on u.id = a.actor_id
       where not $2 or a.action not like 'member\\_%'
       order by a.at desc, a.id desc
       limit $1
      `,
      [limit, booksOnly],
    )
  }
}
