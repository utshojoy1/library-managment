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
        (select count(*)::int from loans where status = 'active' and due_at < now()) as overdue
    `)
    return { books: r!.books, copies: r!.copies, members: r!.members, activeLoans: r!.active_loans, overdue: r!.overdue }
  }
}
