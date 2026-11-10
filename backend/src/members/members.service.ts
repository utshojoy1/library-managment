import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource, type EntityManager, Repository } from 'typeorm'
import type { CreateMemberDto } from './dto/create-member.dto.js'
import { Member } from '../entities/member.entity.js'

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
      .addSelect(
        `(select count(*)::int from loans where loans.member_id = m.id and loans.status = 'active')`,
        'activeLoans',
      )
      .orderBy('m.id', 'DESC')
      .getRawMany()
  }

  create(dto: CreateMemberDto) {
    return this.dataSource.transaction((manager) =>
      this.insert(manager, { name: dto.name, email: dto.email || null, phone: dto.phone || null }),
    )
  }

  /**
   * Inserts a member inside the caller's transaction, then names it `M<id>`
   * (M001, M002…) from its serial id.
   */
  async insert(
    manager: EntityManager,
    values: { name: string; email?: string | null; phone?: string | null; userId?: number },
  ) {
    const { identifiers } = await manager.insert(Member, { ...values, memberNo: `TMP-${randomUUID()}` })
    const id = identifiers[0]!.id as number
    await manager.update(Member, id, { memberNo: `M${String(id).padStart(3, '0')}` })
    return manager.findOneByOrFail(Member, { id })
  }
}
