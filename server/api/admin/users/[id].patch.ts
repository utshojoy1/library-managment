import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '../../../db/client'
import { users } from '../../../db/schema'
import { ROLES, type Role } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const me = requireRole(event, ['super_admin'])
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  }

  const body = await readBody(event).catch(() => ({}))
  const updates: { role?: Role; isActive?: boolean } = {}

  if (body?.role !== undefined) {
    const role = String(body.role) as Role
    if (!ROLES.includes(role)) throw createError({ statusCode: 400, statusMessage: 'Unknown role' })
    updates.role = role
  }
  if (body?.isActive !== undefined) {
    updates.isActive = Boolean(body.isActive)
  }
  if (!Object.keys(updates).length) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  if (target.id === me.id) {
    const demoting = updates.role !== undefined && updates.role !== 'super_admin'
    if (demoting || updates.isActive === false) {
      throw createError({ statusCode: 400, statusMessage: 'You cannot change your own access' })
    }
  }

  const nextRole = updates.role ?? target.role
  const nextActive = updates.isActive ?? target.isActive

  // Never leave the system without a way in.
  if (target.role === 'super_admin' && (nextRole !== 'super_admin' || !nextActive)) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.role, 'super_admin'), eq(users.isActive, true), ne(users.id, target.id)))

    if (count === 0) {
      throw createError({ statusCode: 400, statusMessage: 'At least one active super admin is required' })
    }
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  })

  return updated
})
