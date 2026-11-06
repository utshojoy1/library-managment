/**
 * Delivers mail through SMTP when SMTP_URL is configured, and always records
 * the message in the `emails` outbox so it can be inspected in development.
 */
import { db } from '../db/client'
import { emails } from '../db/schema'

export type MailInput = {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendMail(mail: MailInput) {
  const smtpUrl = process.env.SMTP_URL
  let status: 'queued' | 'sent' | 'failed' = 'queued'
  let error: string | null = null
  let sentAt: Date | null = null

  if (smtpUrl) {
    try {
      const nodemailer = await import('nodemailer')
      const transport = nodemailer.createTransport(smtpUrl)
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? 'Libraria <no-reply@library.local>',
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      })
      status = 'sent'
      sentAt = new Date()
    } catch (e) {
      status = 'failed'
      error = e instanceof Error ? e.message : String(e)
    }
  }

  await db.insert(emails).values({
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    status,
    error,
    sentAt,
  })

  // Without SMTP the outbox is the delivery channel — surface it in the console.
  if (status !== 'sent') {
    console.info(`[mail] ${mail.subject} → ${mail.to}\n${mail.text}`)
  }

  return { status }
}

function layout(heading: string, body: string, cta: string, link: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f7f8fa;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="background:#fff;border:1px solid #e6e8ec;border-radius:14px;padding:28px">
      <div style="font-size:13px;font-weight:700;letter-spacing:.06em;color:#4f46e5;text-transform:uppercase;margin-bottom:18px">Libraria</div>
      <h1 style="margin:0 0 10px;font-size:20px;color:#14161a">${heading}</h1>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475467">${body}</p>
      <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:9px">${cta}</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#98a2b3">If the button doesn't work, paste this link into your browser:<br><span style="color:#4f46e5;word-break:break-all">${link}</span></p>
    </div>
    <p style="text-align:center;font-size:11px;color:#98a2b3;margin-top:16px">Libraria · library management</p>
  </div>
</body></html>`
}

export function verifyEmailMessage(name: string, link: string): Omit<MailInput, 'to'> {
  return {
    subject: 'Verify your Libraria email',
    text: `Hi ${name},\n\nConfirm your email address to finish setting up your account:\n${link}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: layout(
      `Welcome, ${name}`,
      'Confirm your email address to finish setting up your account. The link expires in 24 hours.',
      'Verify email',
      link,
    ),
  }
}

export function resetPasswordMessage(name: string, link: string): Omit<MailInput, 'to'> {
  return {
    subject: 'Reset your Libraria password',
    text: `Hi ${name},\n\nSomeone requested a password reset for your account. Choose a new password here:\n${link}\n\nThe link expires in 1 hour and can only be used once. If this wasn't you, no action is needed — your password is unchanged.`,
    html: layout(
      'Reset your password',
      'Someone requested a password reset for your account. The link expires in 1 hour and works once.',
      'Choose a new password',
      link,
    ),
  }
}
