'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'

const dev = process.env.NODE_ENV === 'development'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Users already signed in on arrival skip login/register (reset and verify links still open).
  // Decided once, so signing in here doesn't race the login page's own ?redirect= navigation.
  const signedInOnArrival = useRef<boolean | null>(null)
  if (signedInOnArrival.current === null && user !== undefined) signedInOnArrival.current = Boolean(user)
  const bounce = signedInOnArrival.current === true && (pathname === '/login' || pathname === '/register')
  useEffect(() => {
    if (bounce) router.replace('/')
  }, [bounce, router])

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

        <div className="auth-card">{bounce ? null : children}</div>

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
