import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Post, Query } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from './db.js'
import { books, copies, loans, members } from './schema.js'
import { CurrentUser, normalizeCode, Roles, STAFF, type SessionUser } from './common.js'

const LOAN_DAYS = 14
const MAX_ACTIVE_LOANS = 5
const DAY_MS = 86_400_000

type Body = Record<string, unknown> | undefined

@Controller('loans')
export class LoansController {
  @Get()
  @Roles(...STAFF)
  list(@Query('status') status?: string, @Query('limit') limit?: string) {
    return db
      .select({
        id: loans.id,
        issuedAt: loans.issuedAt,
        dueAt: loans.dueAt,
        returnedAt: loans.returnedAt,
        status: loans.status,
        barcode: copies.barcode,
        bookTitle: books.title,
        author: books.author,
        memberName: members.name,
        memberNo: members.memberNo,
      })
      .from(loans)
      .innerJoin(copies, eq(loans.copyId, copies.id))
      .innerJoin(books, eq(copies.bookId, books.id))
      .innerJoin(members, eq(loans.memberId, members.id))
      .where(status ? eq(loans.status, status) : undefined)
      .orderBy(desc(loans.issuedAt))
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 200))
  }

  /** Loans belonging to the signed-in account's library card. */
  @Get('mine')
  async mine(@CurrentUser() user: SessionUser) {
    const [member] = await db.select({ id: members.id }).from(members).where(eq(members.userId, user.id)).limit(1)
    if (!member) return []

    return db
      .select({
        id: loans.id,
        issuedAt: loans.issuedAt,
        dueAt: loans.dueAt,
        returnedAt: loans.returnedAt,
        status: loans.status,
        barcode: copies.barcode,
        bookTitle: books.title,
        author: books.author,
      })
      .from(loans)
      .innerJoin(copies, eq(loans.copyId, copies.id))
      .innerJoin(books, eq(copies.bookId, books.id))
      .where(eq(loans.memberId, member.id))
      .orderBy(desc(loans.issuedAt))
      .limit(50)
  }

  @Post('checkout')
  @Roles(...STAFF)
  checkout(@Body() body: Body) {
    const barcode = normalizeCode(body?.barcode)
    const memberNo = normalizeCode(body?.memberNo)
    if (!barcode) throw new BadRequestException('Copy barcode is required')
    if (!memberNo) throw new BadRequestException('Member number is required')

    return db.transaction(async (tx) => {
      // Lock the member too, so two desks can't push them past the loan limit.
      const [member] = await tx.select().from(members).where(eq(members.memberNo, memberNo)).for('update')
      if (!member) throw new NotFoundException(`No member found with number ${memberNo}`)
      if (!member.isActive) throw new ConflictException('This membership is inactive')

      // Lock the copy so two desks cannot issue the same physical book.
      const [row] = await tx
        .select({ copy: copies, bookTitle: books.title })
        .from(copies)
        .innerJoin(books, eq(copies.bookId, books.id))
        .where(eq(copies.barcode, barcode))
        .for('update', { of: copies })
      if (!row) throw new NotFoundException(`No copy found with barcode ${barcode}`)
      if (row.copy.status !== 'available') {
        throw new ConflictException(`Copy ${barcode} is currently ${row.copy.status.replace('_', ' ')}`)
      }

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(loans)
        .where(and(eq(loans.memberId, member.id), eq(loans.status, 'active')))
      if (count >= MAX_ACTIVE_LOANS) {
        throw new ConflictException(`${member.name} already has ${count} books on loan (limit ${MAX_ACTIVE_LOANS})`)
      }

      const [loan] = await tx
        .insert(loans)
        .values({ copyId: row.copy.id, memberId: member.id, dueAt: new Date(Date.now() + LOAN_DAYS * DAY_MS) })
        .returning()
      await tx.update(copies).set({ status: 'on_loan' }).where(eq(copies.id, row.copy.id))

      return { loanId: loan!.id, bookTitle: row.bookTitle, memberName: member.name, dueAt: loan!.dueAt }
    })
  }

  @Post('return')
  @Roles(...STAFF)
  giveBack(@Body() body: Body) {
    const barcode = normalizeCode(body?.barcode)
    if (!barcode) throw new BadRequestException('Copy barcode is required')

    return db.transaction(async (tx) => {
      const [copy] = await tx.select().from(copies).where(eq(copies.barcode, barcode)).for('update')
      if (!copy) throw new NotFoundException(`No copy found with barcode ${barcode}`)

      const [loan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.copyId, copy.id), eq(loans.status, 'active')))
        .limit(1)
      if (!loan) throw new ConflictException(`Copy ${barcode} is not on loan`)

      const [book] = await tx.select({ title: books.title }).from(books).where(eq(books.id, copy.bookId))

      const returnedAt = new Date()
      await tx.update(loans).set({ returnedAt, status: 'returned' }).where(eq(loans.id, loan.id))
      await tx.update(copies).set({ status: 'available' }).where(eq(copies.id, copy.id))

      const daysLate = Math.max(0, Math.floor((returnedAt.getTime() - loan.dueAt.getTime()) / DAY_MS))
      return { bookTitle: book?.title ?? 'Unknown title', daysLate, returnedAt }
    })
  }
}
