import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF, type SessionUser } from '../common/roles.js'
import { CreateMemberDto } from './dto/create-member.dto.js'
import { SetMemberPasswordDto } from './dto/set-password.dto.js'
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
  create(@Body() dto: CreateMemberDto, @CurrentUser() user: SessionUser) {
    return this.members.create(dto, user)
  }

  @Put(':id')
  @Roles('super_admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto, @CurrentUser() user: SessionUser) {
    return this.members.update(id, { name: dto.name, email: dto.email || null, phone: dto.phone || null }, user)
  }

  /** A disabled member keeps their current loans but can't borrow (checkout checks isActive). */
  @Patch(':id/status')
  @Roles('super_admin')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: SetMemberStatusDto, @CurrentUser() user: SessionUser) {
    return this.members.update(id, { isActive: dto.isActive }, user)
  }

  /** Sets the login password of a member's account and signs them out everywhere. Any staff (class-level @Roles). */
  @Put(':id/password')
  @HttpCode(204)
  setPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: SetMemberPasswordDto, @CurrentUser() user: SessionUser) {
    return this.members.setPassword(id, dto.password, user)
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SessionUser) {
    return this.members.remove(id, user)
  }
}
