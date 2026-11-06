import { desc, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { members } from '../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, STAFF)

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
})
