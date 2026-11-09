import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { type EntityManager, IsNull, Repository } from 'typeorm'
import { EmailToken, type EmailTokenPurpose } from './email-token.entity.js'
import { randomToken, sha256 } from './password.js'

const TOKEN_TTL_MINUTES: Record<EmailTokenPurpose, number> = {
  verify_email: 24 * 60,
  reset_password: 60,
}

/** Single-use links for email verification and password reset. */
@Injectable()
export class EmailTokensService {
  constructor(@InjectRepository(EmailToken) private readonly tokens: Repository<EmailToken>) {}

  /**
   * Issues a single-use token and returns the raw value. The database only sees
   * its SHA-256, and earlier unused tokens for the same purpose stop working.
   */
  async issue(userId: number, purpose: EmailTokenPurpose): Promise<string> {
    await this.tokens.update({ userId, purpose, usedAt: IsNull() }, { usedAt: new Date() })

    const token = randomToken()
    await this.tokens.insert({
      userId,
      purpose,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES[purpose] * 60_000),
    })
    return token
  }

  /** Marks the token used in one statement, so two concurrent requests can't both redeem it. */
  async consume(token: string, purpose: EmailTokenPurpose, manager: EntityManager = this.tokens.manager) {
    const now = new Date()
    const { raw } = token
      ? await manager
          .createQueryBuilder()
          .update(EmailToken)
          .set({ usedAt: now })
          .where('token_hash = :hash AND purpose = :purpose AND used_at IS NULL AND expires_at > :now', {
            hash: sha256(token),
            purpose,
            now,
          })
          .returning('user_id')
          .execute()
      : { raw: [] }

    const userId = (raw as { user_id: number }[])[0]?.user_id
    if (!userId) throw new BadRequestException('This link is invalid or has expired. Request a new one.')
    return userId
  }
}
