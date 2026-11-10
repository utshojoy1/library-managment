import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import type { SessionUser } from '../common/roles.js'
import type { UpdateUserDto } from './dto/update-user.dto.js'
import { User } from '../entities/user.entity.js'

/** Account fields an admin may see — never the password hash. */
const toAccount = ({ id, name, email, role, isActive, createdAt }: User) => ({ id, name, email, role, isActive, createdAt })

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    return (await this.users.find({ order: { createdAt: 'DESC' } })).map(toAccount)
  }

  update(id: number, dto: UpdateUserDto, me: SessionUser) {
    const updates: UpdateUserDto = {}
    if (dto.role !== undefined) updates.role = dto.role
    if (dto.isActive !== undefined) updates.isActive = dto.isActive
    if (!Object.keys(updates).length) throw new BadRequestException('Nothing to update')

    if (id === me.id && ((updates.role && updates.role !== 'super_admin') || updates.isActive === false)) {
      throw new BadRequestException('You cannot change your own access')
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock every super admin row: two admins demoting each other at once must not both pass the check.
      const supers = await manager
        .createQueryBuilder(User, 'u')
        .where('u.role = :role', { role: 'super_admin' })
        .setLock('pessimistic_write')
        .getMany()

      const target = await manager
        .createQueryBuilder(User, 'u')
        .where('u.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne()
      if (!target) throw new NotFoundException('User not found')

      const nextRole = updates.role ?? target.role
      const nextActive = updates.isActive ?? target.isActive
      const othersActive = supers.filter((u) => u.isActive && u.id !== id).length

      // Never leave the system without a way in.
      if (target.role === 'super_admin' && (nextRole !== 'super_admin' || !nextActive) && othersActive === 0) {
        throw new BadRequestException('At least one active super admin is required')
      }

      await manager.update(User, id, updates)
      return toAccount({ ...target, ...updates })
    })
  }
}
