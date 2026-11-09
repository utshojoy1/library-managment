import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import type { SessionUser } from '../common/roles.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { UsersService } from './users.service.js'

@Controller('admin/users')
@Roles('super_admin')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll()
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() me: SessionUser) {
    return this.users.update(id, dto, me)
  }
}
