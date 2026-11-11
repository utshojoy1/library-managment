import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { isUniqueViolation } from '../common/db-errors.js'
import { rateLimit } from '../common/rate-limit.js'
import { resetPasswordMessage, verifyEmailMessage } from '../mail/mail.templates.js'
import { MailService } from '../mail/mail.service.js'
import { MembersService } from '../members/members.service.js'
import { User } from '../entities/user.entity.js'
import type { LoginDto } from './dto/login.dto.js'
import type { RegisterDto } from './dto/register.dto.js'
import { EmailTokensService } from './email-tokens.service.js'
import { hashPassword, verifyPassword } from './password.js'
import { Session } from '../entities/session.entity.js'

const FIFTEEN_MIN = 15 * 60 * 1000

/** Email links point at the frontend; never build them from the request's Host header. */
export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly members: MembersService,
    private readonly emailTokens: EmailTokensService,
    private readonly mail: MailService,
  ) {}

  /** Returns the user whose credentials match; the caller starts the session. */
  async validateLogin({ email, password }: LoginDto) {
    rateLimit(`login:${email}`, 10, FIFTEEN_MIN)

    const user = await this.users.findOneBy({ email })
    // Same message for unknown email and wrong password — no account enumeration.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (!user.isActive) throw new ForbiddenException('This account has been disabled')
    return user
  }

  async register({ name, email, password }: RegisterDto) {
    const passwordHash = await hashPassword(password)
    let result: { user: User; memberNo: string }
    try {
      result = await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(manager.create(User, { name, email, passwordHash, role: 'member' }))
        // Self-registered accounts also get a library card, so staff can lend to them.
        // Self sign-up: the new user is their own actor.
        const member = await this.members.insert(manager, { userId: user.id, name, email }, user)
        return { user, memberNo: member.memberNo }
      })
    } catch (error) {
      // Only users.email can collide here: member numbers are random until renamed.
      if (isUniqueViolation(error)) throw new ConflictException('An account with this email already exists')
      throw error
    }

    // Verification mail must never block sign-up; the outbox keeps a record either way.
    try {
      await this.sendVerification(result.user)
    } catch (mailError) {
      this.logger.error('verification email failed', mailError)
    }
    return result
  }

  async verifyEmail(token: string) {
    const userId = await this.emailTokens.consume(token, 'verify_email')
    await this.users.update(userId, { emailVerifiedAt: new Date() })
  }

  async resendVerification(userId: number) {
    rateLimit(`resend-verification:${userId}`, 3, 10 * 60 * 1000)

    const user = await this.users.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')
    if (user.emailVerifiedAt) throw new BadRequestException('This email is already verified')

    await this.sendVerification(user)
    return user.email
  }

  /** Never reveals whether an address has an account. */
  async forgotPassword(email = '') {
    rateLimit(`forgot-password:${email}`, 3, FIFTEEN_MIN)
    if (!email) return

    const user = await this.users.findOneBy({ email })
    if (!user?.isActive) return
    try {
      const token = await this.emailTokens.issue(user.id, 'reset_password')
      await this.mail.send({ to: user.email, ...resetPasswordMessage(user.name, `${APP_URL}/auth/reset-password?token=${token}`) })
    } catch (mailError) {
      this.logger.error('reset email failed', mailError)
    }
  }

  async resetPassword(token: string, password: string) {
    const passwordHash = await hashPassword(password)
    await this.dataSource.transaction(async (manager) => {
      const userId = await this.emailTokens.consume(token, 'reset_password', manager)
      await manager.update(User, userId, { passwordHash })
      // A reset ends every session, so a compromised one dies with it.
      await manager.delete(Session, { userId })
    })
  }

  private async sendVerification(user: User) {
    const token = await this.emailTokens.issue(user.id, 'verify_email')
    await this.mail.send({ to: user.email, ...verifyEmailMessage(user.name, `${APP_URL}/auth/verify-email?token=${token}`) })
  }
}
