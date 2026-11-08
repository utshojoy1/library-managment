import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { Request, Response } from 'express'
import { db } from '../db.js'
import { sessions, users } from '../schema.js'
import { CurrentUser, isUniqueViolation, Public, rateLimit, rateLimitByIp, str, type SessionUser } from '../common.js'
import { createMember } from '../members.controller.js'
import { resetPasswordMessage, sendMail, verifyEmailMessage } from '../mail.js'
import {
  APP_URL,
  consumeEmailToken,
  createSession,
  destroySession,
  hashPassword,
  issueEmailToken,
  publicUser,
  SESSION_COOKIE,
  verifyPassword,
} from './auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIFTEEN_MIN = 15 * 60 * 1000

type Body = Record<string, unknown> | undefined

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: Body, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const email = str(body?.email).toLowerCase()
    const password = String(body?.password ?? '')
    if (!email || !password) throw new BadRequestException('Email and password are required')

    rateLimitByIp(req, 'login-ip', 20, FIFTEEN_MIN)
    rateLimit(`login:${email}`, 10, FIFTEEN_MIN)

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    // Same message for unknown email and wrong password — no account enumeration.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (!user.isActive) throw new ForbiddenException('This account has been disabled')

    await createSession(res, user.id)
    return publicUser(user)
  }

  @Public()
  @Post('register')
  async register(@Body() body: Body, @Res({ passthrough: true }) res: Response) {
    const name = str(body?.name)
    const email = str(body?.email).toLowerCase()
    const password = String(body?.password ?? '')

    if (!name) throw new BadRequestException('Name is required')
    if (!EMAIL_RE.test(email)) throw new BadRequestException('Enter a valid email address')
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters')

    const passwordHash = await hashPassword(password)
    let user
    try {
      user = await db.transaction(async (tx) => {
        const [created] = await tx.insert(users).values({ name, email, passwordHash, role: 'member' }).returning()
        // Self-registered accounts also get a library card, so staff can lend to them.
        const member = await createMember(tx, { userId: created!.id, name, email })
        return { ...created!, memberNo: member.memberNo }
      })
    } catch (error) {
      // Only users.email can collide here: member numbers are random until renamed.
      if (isUniqueViolation(error)) throw new ConflictException('An account with this email already exists')
      throw error
    }

    await createSession(res, user.id)

    // Verification mail must never block sign-up; the outbox keeps a record either way.
    try {
      const token = await issueEmailToken(user.id, 'verify_email')
      await sendMail({ to: email, ...verifyEmailMessage(name, `${APP_URL}/verify-email?token=${token}`) })
    } catch (mailError) {
      console.error('[register] verification email failed', mailError)
    }

    return { ...publicUser(user), memberNo: user.memberNo }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await destroySession(req.cookies?.[SESSION_COOKIE], res)
    return { ok: true }
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    return user
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() body: Body) {
    const userId = await consumeEmailToken(str(body?.token), 'verify_email')
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId))
    return { ok: true }
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@CurrentUser() user: SessionUser) {
    rateLimit(`resend-verification:${user.id}`, 3, 10 * 60 * 1000)

    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
    if (!row) throw new NotFoundException('User not found')
    if (row.emailVerifiedAt) throw new BadRequestException('This email is already verified')

    const token = await issueEmailToken(user.id, 'verify_email')
    await sendMail({ to: row.email, ...verifyEmailMessage(row.name, `${APP_URL}/verify-email?token=${token}`) })
    return { ok: true, email: row.email }
  }

  /** Always answers 200 — never reveal whether an address has an account. */
  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: Body, @Req() req: Request) {
    const email = str(body?.email).toLowerCase()
    rateLimit(`forgot-password:${email}`, 3, FIFTEEN_MIN)
    rateLimitByIp(req, 'forgot-password-ip', 10, FIFTEEN_MIN)

    if (email) {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (user?.isActive) {
        try {
          const token = await issueEmailToken(user.id, 'reset_password')
          await sendMail({ to: user.email, ...resetPasswordMessage(user.name, `${APP_URL}/reset-password?token=${token}`) })
        } catch (mailError) {
          console.error('[forgot-password] email failed', mailError)
        }
      }
    }
    return { ok: true }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: Body, @Req() req: Request) {
    rateLimitByIp(req, 'reset-password-ip', 10, FIFTEEN_MIN)

    const password = String(body?.password ?? '')
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters')
    const passwordHash = await hashPassword(password)

    await db.transaction(async (tx) => {
      const userId = await consumeEmailToken(str(body?.token), 'reset_password', tx)
      await tx.update(users).set({ passwordHash }).where(eq(users.id, userId))
      // A reset ends every session, so a compromised one dies with it.
      await tx.delete(sessions).where(eq(sessions.userId, userId))
    })
    return { ok: true }
  }
}
