import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { desc, eq, sql } from 'drizzle-orm'
import { db, type Tx } from './db.js'
import { members } from './schema.js'
import { Roles, STAFF, str } from './common.js'

/** Inserts a member, then names it `M<id>` (M001, M002…) from its serial id. */
export async function createMember(
  tx: Tx,
  values: { name: string; email?: string | null; phone?: string | null; userId?: number },
) {
  const [row] = await tx.insert(members).values({ ...values, memberNo: `TMP-${randomUUID()}` }).returning()
  const [member] = await tx
    .update(members)
    .set({ memberNo: `M${String(row!.id).padStart(3, '0')}` })
    .where(eq(members.id, row!.id))
    .returning()
  return member!
}

@Controller('members')
@Roles(...STAFF)
export class MembersController {
  @Get()
  list() {
    return db
      .select({
        id: members.id,
        memberNo: members.memberNo,
        name: members.name,
        email: members.email,
        phone: members.phone,
        joinedAt: members.joinedAt,
        isActive: members.isActive,
        activeLoans: sql<number>`(
          select count(*)::int from loans
          where loans.member_id = members.id and loans.status = 'active'
        )`,
      })
      .from(members)
      .orderBy(desc(members.id))
  }

  @Post()
  create(@Body() body: Record<string, unknown> | undefined) {
    const name = str(body?.name)
    if (!name) throw new BadRequestException('Name is required')
    return db.transaction((tx) =>
      createMember(tx, { name, email: str(body?.email) || null, phone: str(body?.phone) || null }),
    )
  }
}
