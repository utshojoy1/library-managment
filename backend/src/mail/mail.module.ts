import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DevOutboxController } from './dev-outbox.controller.js'
import { Email } from '../entities/email.entity.js'
import { MailService } from './mail.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Email])],
  controllers: [DevOutboxController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
