import Link from 'next/link'
import type { ReactNode } from 'react'

const dev = process.env.NODE_ENV === 'development'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">L</span>
          <div>
            <strong>Libraria</strong>
            <small>Library manager</small>
          </div>
        </div>

        <div className="auth-card">{children}</div>

        <p className="auth-foot">
          Catalog · Members · Circulation
          {dev && (
            <>
              {' · '}
              <Link href="/dev/mail" className="link-sm">
                Dev inbox
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
