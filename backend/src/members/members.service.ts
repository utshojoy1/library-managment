import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { isEmail } from 'class-validator'
import { DataSource, type EntityManager, Repository } from 'typeorm'
import type { CreateMemberDto } from './dto/create-member.dto.js'
import { hashPassword } from '../auth/password.js'
import { Loan } from '../entities/loan.entity.js'
import { Member } from '../entities/member.entity.js'
import { Session } from '../entities/session.entity.js'
import { User } from '../entities/user.entity.js'
import { type Actor, logActivity } from '../common/activity.js'
import type { SessionUser } from '../common/roles.js'
import { isUniqueViolation } from '../common/db-errors.js'

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

  async create(dto: CreateMemberDto, actor: Actor) {
    const email = dto.email || null
    if (dto.password && !email) throw new BadRequestException('An email is required to create a login')
    if (dto.password && !isEmail(email)) throw new BadRequestException('Enter a valid email address')
    const passwordHash = dto.password ? await hashPassword(dto.password) : null
    try {
      return await this.dataSource.transaction(async (manager) => {
        // With a password, also create the login account, the same shape self-registration makes.
        const userId = passwordHash
          ? (await manager.save(manager.create(User, { name: dto.name, email: email!.toLowerCase(), passwordHash, role: 'member' }))).id
          : undefined
        return this.insert(manager, { name: dto.name, email, phone: dto.phone || null, userId }, actor)
      })
    } catch (error) {
      // Only users.email can collide here: member numbers are random until renamed.
      if (isUniqueViolation(error)) throw new ConflictException('An account with this email already exists')
      throw error
    }
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

  async setPassword(id: number, password: string, actor: SessionUser) {
    const passwordHash = await hashPassword(password)
    await this.dataSource.transaction(async (manager) => {
      const member = await manager.findOneBy(Member, { id })
      if (!member) throw new NotFoundException('Member not found')
      if (!member.userId) throw new BadRequestException('This member has no login account')
      // A member card can be linked to a staff account; only a super admin may reset staff passwords.
      const account = await manager.findOneByOrFail(User, { id: member.userId })
      if (account.role !== 'member' && actor.role !== 'super_admin') {
        throw new ForbiddenException('Only a super admin can change a staff account’s password')
      }
      await manager.update(User, member.userId, { passwordHash })
      // Same as a self-service reset: every existing session ends.
      await manager.delete(Session, { userId: member.userId })
      await logActivity(manager, actor, { action: 'member_updated', subject: member.name, detail: 'Password changed', memberId: id })
    })
  }

  remove(id: number, actor: Actor) {
    return this.dataSource.transaction(async (manager) => {
      // Lock the member so a checkout can't slip in between the check and the delete.
      const member = await manager.createQueryBuilder(Member, 'm').where('m.id = :id', { id }).setLock('pessimistic_write').getOne()
      if (!member) throw new NotFoundException('Member not found')
      if (await manager.countBy(Loan, { memberId: id, status: 'active' })) {
        throw new ConflictException('This member still has borrowed books — return them before deleting')
      }
      // Keep the borrow history: snapshot who borrowed, then the FK sets member_id to null.
      await manager.update(Loan, { memberId: id }, { memberName: member.name, memberNo: member.memberNo })
      await manager.delete(Member, id)
      await logActivity(manager, actor, { action: 'member_deleted', subject: member.name, detail: member.memberNo })
    })
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
