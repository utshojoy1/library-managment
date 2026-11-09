import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Public } from '../common/decorators/public.decorator.js'
import { rateLimitByIp } from '../common/rate-limit.js'
import type { SessionUser } from '../common/roles.js'
import { AuthService } from './auth.service.js'
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/email-link.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { publicUser, SESSION_COOKIE, SessionsService } from './sessions.service.js'

const FIFTEEN_MIN = 15 * 60 * 1000

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    rateLimitByIp(req, 'login-ip', 20, FIFTEEN_MIN)
    const user = await this.auth.validateLogin(dto)
    await this.sessions.start(res, user.id)
    return publicUser(user)
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, memberNo } = await this.auth.register(dto)
    await this.sessions.start(res, user.id)
    return { ...publicUser(user), memberNo }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.sessions.end(req.cookies?.[SESSION_COOKIE], res)
    return { ok: true }
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    return user
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token)
    return { ok: true }
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@CurrentUser() user: SessionUser) {
    return { ok: true, email: await this.auth.resendVerification(user.id) }
  }

  /** Always answers 200 — never reveal whether an address has an account. */
  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    rateLimitByIp(req, 'forgot-password-ip', 10, FIFTEEN_MIN)
    await this.auth.forgotPassword(dto.email)
    return { ok: true }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    rateLimitByIp(req, 'reset-password-ip', 10, FIFTEEN_MIN)
    await this.auth.resetPassword(dto.token, dto.password)
    return { ok: true }
  }
}
