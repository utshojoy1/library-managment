import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF } from '../common/roles.js'
import { CreateMemberDto } from './dto/create-member.dto.js'
import { SetMemberStatusDto, UpdateMemberDto } from './dto/update-member.dto.js'
import { MembersService } from './members.service.js'

@Controller('members')
@Roles(...STAFF)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  findAll() {
    return this.members.findAll()
  }

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.members.create(dto)
  }

  @Put(':id')
  @Roles('super_admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, { name: dto.name, email: dto.email || null, phone: dto.phone || null })
  }

  /** A disabled member keeps their current loans but can't borrow (checkout checks isActive). */
  @Patch(':id/status')
  @Roles('super_admin')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: SetMemberStatusDto) {
    return this.members.update(id, { isActive: dto.isActive })
  }
}
