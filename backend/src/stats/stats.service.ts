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
   * Recent events across the library, newest first, derived from existing timestamps.
   * shortcut: edits and deletions leave no trace here; add an audit-log table if those must show up.
   */
  activity(limit = 12) {
    return this.dataSource.query<{ type: string; at: string; subject: string; detail: string | null; bookId: number | null }[]>(
      `
      select * from (
        select 'book_added' as type, b.created_at as at, b.title as subject, b.author as detail, b.id as "bookId"
          from books b
        union all
        -- members only record a join *date*, so they sort at midnight of that day
        select 'member_joined', m.joined_at::timestamptz, m.name, m.member_no, null
          from members m
        union all
        select 'issued', l.issued_at, b.title, m.name, b.id
          from loans l join copies c on c.id = l.copy_id join books b on b.id = c.book_id join members m on m.id = l.member_id
        union all
        select 'returned', l.returned_at, b.title, m.name, b.id
          from loans l join copies c on c.id = l.copy_id join books b on b.id = c.book_id join members m on m.id = l.member_id
          where l.returned_at is not null
      ) a
      order by at desc
      limit $1
      `,
      [limit],
    )
  }
}
