import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import type { Mail } from '@/lib/types'
import { RefreshButton } from '@/components/dev-mail/refresh-button'

export const metadata: Metadata = { title: 'Dev inbox' }

function linksIn(text: string) {
  return Array.from(new Set(text.match(/https?:\/\/\S+/g) ?? []))
}

export default async function DevMailPage() {
  let mails: Mail[]
  try {
    mails = await api<Mail[]>('/dev/outbox')
  } catch (error) {
    // The API hides the outbox in production or when SMTP is configured.
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  return (
    <div className="mail-shell">
      <header className="mail-head">
        <div>
          <h1>Dev inbox</h1>
          <p>Messages captured by the outbox. No SMTP is configured, so nothing left this machine.</p>
        </div>
        <RefreshButton />
      </header>

      {!mails.length && (
        <div className="card">
          <div className="empty">No messages yet — register an account or request a password reset to see one here.</div>
        </div>
      )}

      {mails.map((mail) => (
        <article key={mail.id} className="card mail-card">
          <div className="mail-top">
            <div>
              <strong>{mail.subject}</strong>
              <div className="mono">to {mail.to}</div>
            </div>
            <span className="chip chip-gray">{new Date(mail.createdAt).toLocaleString('en-GB')}</span>
          </div>
          {linksIn(mail.text).length > 0 && (
            <div className="mail-links">
              {linksIn(mail.text).map((link) => (
                <a key={link} href={link} className="mail-link">{link}</a>
              ))}
            </div>
          )}
        </article>
      ))}

      <p className="hint" style={{ textAlign: 'center' }}>
        Development only · <Link href="/login" className="link-sm">Back to sign in</Link>
      </p>
    </div>
  )
}
