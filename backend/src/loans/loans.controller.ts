import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { STAFF, type SessionUser } from '../common/roles.js'
import { CheckoutDto } from './dto/checkout.dto.js'
import { ListLoansQueryDto } from './dto/list-loans-query.dto.js'
import { ReturnCopyDto } from './dto/return-copy.dto.js'
import { LoansService } from './loans.service.js'

@Controller('loans')
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Get()
  @Roles(...STAFF)
  findAll(@Query() query: ListLoansQueryDto) {
    return this.loans.findAll(query)
  }

  /** Loans belonging to the signed-in account's library card. */
  @Get('mine')
  findMine(@CurrentUser() user: SessionUser) {
    return this.loans.findForUser(user.id)
  }

  @Post('checkout')
  @Roles(...STAFF)
  checkout(@Body() dto: CheckoutDto, @CurrentUser() user: SessionUser) {
    return this.loans.checkout(dto, user)
  }

  @Post('return')
  @Roles(...STAFF)
  returnCopy(@Body() dto: ReturnCopyDto, @CurrentUser() user: SessionUser) {
    return this.loans.returnCopy(dto.barcode, user)
  }
}
