import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'
import { db } from './db.js'
import { users } from './schema.js'
import { CurrentUser, ROLES, Roles, type Role, type SessionUser } from './common.js'

const columns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
}

@Controller('admin/users')
@Roles('super_admin')
export class AdminController {
  @Get()
  list() {
    return db.select(columns).from(users).orderBy(desc(users.createdAt))
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown> | undefined,
    @CurrentUser() me: SessionUser,
  ) {
    const updates: { role?: Role; isActive?: boolean } = {}
    if (body?.role !== undefined) {
      const role = String(body.role) as Role
      if (!ROLES.includes(role)) throw new BadRequestException('Unknown role')
      updates.role = role
    }
    if (body?.isActive !== undefined) updates.isActive = Boolean(body.isActive)
    if (!Object.keys(updates).length) throw new BadRequestException('Nothing to update')

    if (id === me.id && ((updates.role && updates.role !== 'super_admin') || updates.isActive === false)) {
      throw new BadRequestException('You cannot change your own access')
    }

    return db.transaction(async (tx) => {
      // Lock every super admin row: two admins demoting each other at once must not both pass the check.
      const supers = await tx
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(eq(users.role, 'super_admin'))
        .for('update')

      const [target] = await tx.select().from(users).where(eq(users.id, id)).for('update')
      if (!target) throw new NotFoundException('User not found')

      const nextRole = updates.role ?? target.role
      const nextActive = updates.isActive ?? target.isActive
      const othersActive = supers.filter((u) => u.isActive && u.id !== id).length

      // Never leave the system without a way in.
      if (target.role === 'super_admin' && (nextRole !== 'super_admin' || !nextActive) && othersActive === 0) {
        throw new BadRequestException('At least one active super admin is required')
      }

      const [updated] = await tx.update(users).set(updates).where(eq(users.id, id)).returning(columns)
      return updated
    })
  }
}
