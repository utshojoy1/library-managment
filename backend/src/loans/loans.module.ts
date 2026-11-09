import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Member } from '../members/member.entity.js'
import { Loan } from './loan.entity.js'
import { LoansController } from './loans.controller.js'
import { LoansService } from './loans.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Member])],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
