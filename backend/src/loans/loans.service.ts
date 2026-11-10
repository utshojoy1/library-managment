import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Book } from '../entities/book.entity.js'
import { Copy } from '../entities/copy.entity.js'
import { Member } from '../entities/member.entity.js'
import type { CheckoutDto } from './dto/checkout.dto.js'
import type { ListLoansQueryDto } from './dto/list-loans-query.dto.js'
import { Loan } from '../entities/loan.entity.js'

const LOAN_DAYS = 14
const MAX_ACTIVE_LOANS = 5
const DAY_MS = 86_400_000
const MAX_LOAN_DAYS = 90

/** End of the chosen day (server time), so a book due "on the 20th" is not overdue during the 20th. */
function customDueAt(date: string) {
  const dueAt = new Date(`${date}T23:59:59`)
  // JS rolls impossible dates over (Feb 31 → Mar 3), so check the day survived.
  if (Number.isNaN(dueAt.getTime()) || dueAt.getDate() !== Number(date.slice(8))) {
    throw new BadRequestException('Due date is not a valid date')
  }
  if (dueAt.getTime() <= Date.now()) throw new BadRequestException('Due date must be today or later')
  if (dueAt.getTime() > Date.now() + MAX_LOAN_DAYS * DAY_MS) {
    throw new BadRequestException(`Due date can be at most ${MAX_LOAN_DAYS} days away`)
  }
  return dueAt
}

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

  findAll({ status, bookId, limit = 50 }: ListLoansQueryDto) {
    const query = this.loanRows()
      .innerJoin('l.member', 'm')
      .addSelect('m.name', 'memberName')
      .addSelect('m.memberNo', 'memberNo')
      .limit(limit)
    if (status) query.andWhere('l.status = :status', { status })
    if (bookId) query.andWhere('c.bookId = :bookId', { bookId })
    return query.getRawMany()
  }

  /** Loans belonging to a user account's library card. */
  async findForUser(userId: number) {
    const member = await this.members.findOneBy({ userId })
    if (!member) return []
    return this.loanRows().where('l.memberId = :memberId', { memberId: member.id }).limit(50).getRawMany()
  }

  checkout({ barcode, memberNo, dueDate }: CheckoutDto) {
    const dueAt = dueDate ? customDueAt(dueDate) : new Date(Date.now() + LOAN_DAYS * DAY_MS)
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
        throw new ConflictException(`Copy ${barcode} is already borrowed`)
      }

      const count = await manager.countBy(Loan, { memberId: member.id, status: 'active' })
      if (count >= MAX_ACTIVE_LOANS) {
        throw new ConflictException(`${member.name} already has ${count} books borrowed (limit ${MAX_ACTIVE_LOANS})`)
      }

      const loan = await manager.save(
        manager.create(Loan, { copyId: copy.id, memberId: member.id, dueAt }),
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
      if (!loan) throw new ConflictException(`Copy ${barcode} is not borrowed`)

      const book = await manager.findOneBy(Book, { id: copy.bookId })

      const returnedAt = new Date()
      await manager.update(Loan, loan.id, { returnedAt, status: 'returned' })
      await manager.update(Copy, copy.id, { status: 'available' })

      const daysLate = Math.max(0, Math.floor((returnedAt.getTime() - loan.dueAt.getTime()) / DAY_MS))
      return { bookTitle: book?.title ?? 'Unknown title', daysLate, returnedAt }
    })
  }
}
