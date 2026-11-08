'use client'

import Link from 'next/link'
import { useApi } from '@/lib/api'

type Mail = { id: number; to: string; subject: string; text: string; createdAt: string }

function linksIn(text: string) {
  return Array.from(new Set(text.match(/https?:\/\/\S+/g) ?? []))
}

export default function DevMailPage() {
  const { data: mails, error, refresh } = useApi<Mail[]>('/dev/outbox')

  return (
    <div className="mail-shell">
      <header className="mail-head">
        <div>
          <h1>Dev inbox</h1>
          <p>Messages captured by the outbox. No SMTP is configured, so nothing left this machine.</p>
        </div>
        <button className="btn btn-sm" onClick={refresh}>Refresh</button>
      </header>

      {error && <div className="banner banner-error">Could not load the outbox.</div>}

      {!mails?.length && (
        <div className="card">
          <div className="empty">No messages yet — register an account or request a password reset to see one here.</div>
        </div>
      )}

      {mails?.map((mail) => (
        <article key={mail.id} className="card mail-card">
          <div className="mail-top">
            <div>
              <strong>{mail.subject}</strong>
              <div className="mono">to {mail.to}</div>
            </div>
            <span className="chip chip-gray">{new Date(mail.createdAt).toLocaleString()}</span>
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
