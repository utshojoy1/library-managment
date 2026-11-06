import { desc } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  requireRole(event, ['super_admin'])

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
})
