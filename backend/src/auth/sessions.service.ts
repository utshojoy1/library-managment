import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Response } from 'express'
import { LessThan, Repository } from 'typeorm'
import type { Role, SessionUser } from '../common/roles.js'
import type { User } from '../users/user.entity.js'
import { randomToken, sha256 } from './password.js'
import { Session } from './session.entity.js'

export const SESSION_COOKIE = 'library_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** The user as the frontend sees it. */
export function publicUser(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'emailVerifiedAt'>): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

/** Cookie sessions: the browser holds a random token, the database only its SHA-256. */
@Injectable()
export class SessionsService {
  constructor(@InjectRepository(Session) private readonly sessions: Repository<Session>) {}

  async start(res: Response, userId: number) {
    const token = randomToken()
    // Expired sessions are only otherwise removed when reused; sweep them here.
    await this.sessions.delete({ expiresAt: LessThan(new Date()) })
    await this.sessions.insert({ id: sha256(token), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_MS,
    })
  }

  async end(token: string | undefined, res: Response) {
    if (token) await this.sessions.delete({ id: sha256(token) })
    res.clearCookie(SESSION_COOKIE, { path: '/' })
  }

  async findUser(token: string | undefined): Promise<SessionUser | null> {
    if (!token) return null
    const session = await this.sessions.findOne({ where: { id: sha256(token) }, relations: { user: true } })
    if (!session?.user || session.expiresAt < new Date() || !session.user.isActive) return null
    return publicUser(session.user)
  }
}
