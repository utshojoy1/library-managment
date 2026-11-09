import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Book } from '../books/book.entity.js'
import { Copy } from '../books/copy.entity.js'
import { Member } from '../members/member.entity.js'
import type { CheckoutDto } from './dto/checkout.dto.js'
import type { ListLoansQueryDto } from './dto/list-loans-query.dto.js'
import { Loan } from './loan.entity.js'

const LOAN_DAYS = 14
const MAX_ACTIVE_LOANS = 5
const DAY_MS = 86_400_000

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan) private readonly loans: Repository<Loan>,
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Loans joined with their copy and book; one row per loan. */
  private loanRows() {
    return this.loans
      .createQueryBuilder('l')
      .innerJoin('l.copy', 'c')
      .innerJoin('c.book', 'b')
      .select('l.id', 'id')
      .addSelect('l.issuedAt', 'issuedAt')
      .addSelect('l.dueAt', 'dueAt')
      .addSelect('l.returnedAt', 'returnedAt')
      .addSelect('l.status', 'status')
      .addSelect('c.barcode', 'barcode')
      .addSelect('b.title', 'bookTitle')
      .addSelect('b.author', 'author')
      .orderBy('l.issuedAt', 'DESC')
  }

  findAll({ status, limit = 50 }: ListLoansQueryDto) {
    const query = this.loanRows()
      .innerJoin('l.member', 'm')
      .addSelect('m.name', 'memberName')
      .addSelect('m.memberNo', 'memberNo')
      .limit(limit)
    if (status) query.where('l.status = :status', { status })
    return query.getRawMany()
  }

  /** Loans belonging to a user account's library card. */
  async findForUser(userId: number) {
    const member = await this.members.findOneBy({ userId })
    if (!member) return []
    return this.loanRows().where('l.memberId = :memberId', { memberId: member.id }).limit(50).getRawMany()
  }

  checkout({ barcode, memberNo }: CheckoutDto) {
    return this.dataSource.transaction(async (manager) => {
      // Lock the member too, so two desks can't push them past the loan limit.
      const member = await manager
        .createQueryBuilder(Member, 'm')
        .where('m.memberNo = :memberNo', { memberNo })
        .setLock('pessimistic_write')
        .getOne()
      if (!member) throw new NotFoundException(`No member found with number ${memberNo}`)
      if (!member.isActive) throw new ConflictException('This membership is inactive')

      // Lock the copy (not its book) so two desks cannot issue the same physical book.
      const copy = await manager
        .createQueryBuilder(Copy, 'c')
        .innerJoinAndSelect('c.book', 'b')
        .where('c.barcode = :barcode', { barcode })
        .setLock('pessimistic_write', undefined, ['c'])
        .getOne()
      if (!copy) throw new NotFoundException(`No copy found with barcode ${barcode}`)
      if (copy.status !== 'available') {
        throw new ConflictException(`Copy ${barcode} is currently ${copy.status.replace('_', ' ')}`)
      }

      const count = await manager.countBy(Loan, { memberId: member.id, status: 'active' })
      if (count >= MAX_ACTIVE_LOANS) {
        throw new ConflictException(`${member.name} already has ${count} books on loan (limit ${MAX_ACTIVE_LOANS})`)
      }

      const loan = await manager.save(
        manager.create(Loan, { copyId: copy.id, memberId: member.id, dueAt: new Date(Date.now() + LOAN_DAYS * DAY_MS) }),
      )
      await manager.update(Copy, copy.id, { status: 'on_loan' })

      return { loanId: loan.id, bookTitle: copy.book!.title, memberName: member.name, dueAt: loan.dueAt }
    })
  }

  returnCopy(barcode: string) {
    return this.dataSource.transaction(async (manager) => {
      const copy = await manager
        .createQueryBuilder(Copy, 'c')
        .where('c.barcode = :barcode', { barcode })
        .setLock('pessimistic_write')
        .getOne()
      if (!copy) throw new NotFoundException(`No copy found with barcode ${barcode}`)

      const loan = await manager.findOneBy(Loan, { copyId: copy.id, status: 'active' })
      if (!loan) throw new ConflictException(`Copy ${barcode} is not on loan`)

      const book = await manager.findOneBy(Book, { id: copy.bookId })

      const returnedAt = new Date()
      await manager.update(Loan, loan.id, { returnedAt, status: 'returned' })
      await manager.update(Copy, copy.id, { status: 'available' })

      const daysLate = Math.max(0, Math.floor((returnedAt.getTime() - loan.dueAt.getTime()) / DAY_MS))
      return { bookTitle: book?.title ?? 'Unknown title', daysLate, returnedAt }
    })
  }
}
