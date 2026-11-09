import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailModule } from '../mail/mail.module.js'
import { MembersModule } from '../members/members.module.js'
import { User } from '../users/user.entity.js'
import { AuthController } from './auth.controller.js'
import { AuthGuard } from './auth.guard.js'
import { AuthService } from './auth.service.js'
import { EmailToken } from './email-token.entity.js'
import { EmailTokensService } from './email-tokens.service.js'
import { Session } from './session.entity.js'
import { SessionsService } from './sessions.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, EmailToken]), MembersModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionsService,
    EmailTokensService,
    // Registered here so it can inject SessionsService; applies to every route in the app.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
