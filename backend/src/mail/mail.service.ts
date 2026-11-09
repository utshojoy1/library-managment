import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Email, type EmailStatus } from './email.entity.js'
import type { MailInput } from './mail.templates.js'

/** The dev inbox exists only when nothing is really sent and we are not in production. */
export const DEV_INBOX = process.env.NODE_ENV !== 'production' && !process.env.SMTP_URL

/**
 * Delivers mail through SMTP when SMTP_URL is configured, and always records
 * the message in the `emails` outbox so it can be inspected in development.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(@InjectRepository(Email) private readonly emails: Repository<Email>) {}

  async send(mail: MailInput) {
    const smtpUrl = process.env.SMTP_URL
    let status: EmailStatus = 'queued'
    let error: string | null = null
    let sentAt: Date | null = null

    if (smtpUrl) {
      try {
        const nodemailer = await import('nodemailer')
        await nodemailer.createTransport(smtpUrl).sendMail({
          from: process.env.MAIL_FROM ?? 'Libraria <no-reply@library.local>',
          ...mail,
        })
        status = 'sent'
        sentAt = new Date()
      } catch (e) {
        status = 'failed'
        error = e instanceof Error ? e.message : String(e)
      }
    }

    await this.emails.insert({ to: mail.to, subject: mail.subject, text: mail.text, status, error, sentAt })

    if (status !== 'sent') this.logger.log(`${mail.subject} → ${mail.to}\n${mail.text}`)
    return { status }
  }

  recent() {
    return this.emails.find({
      select: { id: true, to: true, subject: true, text: true, status: true, createdAt: true },
      order: { id: 'DESC' },
      take: 25,
    })
  }
}
