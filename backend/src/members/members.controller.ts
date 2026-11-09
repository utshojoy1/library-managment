import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF } from '../common/roles.js'
import { CreateMemberDto } from './dto/create-member.dto.js'
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
}
