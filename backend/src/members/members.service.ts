import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource, type EntityManager, Repository } from 'typeorm'
import type { CreateMemberDto } from './dto/create-member.dto.js'
import { hashPassword } from '../auth/password.js'
import { Member } from '../entities/member.entity.js'
import { Session } from '../entities/session.entity.js'
import { User } from '../entities/user.entity.js'
import { type Actor, logActivity } from '../common/activity.js'
import { isForeignKeyViolation } from '../common/db-errors.js'

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private readonly members: Repository<Member>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.members
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .addSelect('m.memberNo', 'memberNo')
      .addSelect('m.name', 'name')
      .addSelect('m.email', 'email')
      .addSelect('m.phone', 'phone')
      .addSelect('m.joined_at::text', 'joinedAt')
      .addSelect('m.isActive', 'isActive')
      .addSelect('m.userId is not null', 'hasAccount')
      .addSelect(
        `(select count(*)::int from loans where loans.member_id = m.id and loans.status = 'active')`,
        'activeLoans',
      )
      .orderBy('m.id', 'DESC')
      .getRawMany()
  }

  create(dto: CreateMemberDto, actor: Actor) {
    return this.dataSource.transaction((manager) =>
      this.insert(manager, { name: dto.name, email: dto.email || null, phone: dto.phone || null }, actor),
    )
  }

  /** Changing only `isActive` logs as enabled/disabled; anything else as an edit. */
  update(id: number, values: Partial<Pick<Member, 'name' | 'email' | 'phone' | 'isActive'>>, actor: Actor) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.update(Member, id, values)
      if (!result.affected) throw new NotFoundException('Member not found')
      const member = await manager.findOneByOrFail(Member, { id })
      const action = values.isActive === undefined ? 'member_updated' : values.isActive ? 'member_enabled' : 'member_disabled'
      await logActivity(manager, actor, { action, subject: member.name, detail: member.memberNo, memberId: id })
      return member
    })
  }

  async setPassword(id: number, password: string, actor: Actor) {
    const passwordHash = await hashPassword(password)
    await this.dataSource.transaction(async (manager) => {
      const member = await manager.findOneBy(Member, { id })
      if (!member) throw new NotFoundException('Member not found')
      if (!member.userId) throw new BadRequestException('This member has no login account')
      await manager.update(User, member.userId, { passwordHash })
      // Same as a self-service reset: every existing session ends.
      await manager.delete(Session, { userId: member.userId })
      await logActivity(manager, actor, { action: 'member_updated', subject: member.name, detail: 'Password changed', memberId: id })
    })
  }

  async remove(id: number, actor: Actor) {
    try {
      await this.dataSource.transaction(async (manager) => {
        const member = await manager.findOneBy(Member, { id })
        if (!member) throw new NotFoundException('Member not found')
        // Loans don't cascade, so the database itself refuses a member with any borrow history.
        await manager.delete(Member, id)
        await logActivity(manager, actor, { action: 'member_deleted', subject: member.name, detail: member.memberNo })
      })
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException('This member has borrow history, so they can’t be deleted — disable them instead')
      }
      throw error
    }
  }

  /**
   * Inserts a member inside the caller's transaction, then names it `M<id>`
   * (M001, M002…) from its serial id.
   */
  async insert(
    manager: EntityManager,
    values: { name: string; email?: string | null; phone?: string | null; userId?: number },
    actor: Actor,
  ) {
    const { identifiers } = await manager.insert(Member, { ...values, memberNo: `TMP-${randomUUID()}` })
    const id = identifiers[0]!.id as number
    const memberNo = `M${String(id).padStart(3, '0')}`
    await manager.update(Member, id, { memberNo })
    await logActivity(manager, actor, { action: 'member_joined', subject: values.name, detail: memberNo, memberId: id })
    return manager.findOneByOrFail(Member, { id })
  }
}
