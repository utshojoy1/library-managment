'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ROLE_LABELS, type Role } from '@/lib/format'

const STAFF: Role[] = ['admin', 'super_admin']

// Page access by path. The API enforces the same rules; this only redirects.
const PAGE_ROLES: Record<string, Role[]> = {
  '/members': STAFF,
  '/circulation': STAFF,
  '/admin/users': ['super_admin'],
}

const ICONS: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  swap: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isStaff, isSuperAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const roles = PAGE_ROLES[pathname]
  const allowed = user && (!roles || roles.includes(user.role))

  useEffect(() => {
    if (user === null) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    else if (user && !allowed) router.replace('/')
  }, [user, allowed, pathname, router])

  if (!allowed) return null

  const links = [
    { to: '/', label: 'Dashboard', icon: 'grid', show: true },
    { to: '/catalog', label: 'Catalog', icon: 'book', show: true },
    { to: '/members', label: 'Members', icon: 'users', show: isStaff },
    { to: '/circulation', label: 'Circulation', icon: 'swap', show: isStaff },
    { to: '/admin/users', label: 'Users', icon: 'shield', show: isSuperAdmin },
  ].filter((link) => link.show)

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  async function signOut() {
    await api('/auth/logout', { method: 'POST' })
    // Full reload: clears all client state, and doesn't race this layout's own signed-out redirect.
    window.location.assign('/login')
  }

  async function resendVerification() {
    setResending(true)
    setResendMessage('')
    try {
      await api('/auth/resend-verification', { method: 'POST' })
      setResendMessage('Sent — check your inbox.')
    } catch (e) {
      setResendMessage(errorMessage(e))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <div>
            <strong>Libraria</strong>
            <small>Library manager</small>
          </div>
        </div>

        <nav className="nav">
          {links.map((link) => (
            <Link key={link.to} href={link.to} className={`nav-link${isActive(link.to) ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[link.icon]}
              </svg>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="user-box">
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <strong>{user.name}</strong>
            <span className="chip chip-gray">{ROLE_LABELS[user.role]}</span>
          </div>
          <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={signOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          {!user.emailVerified && (
            <div className="verify-banner">
              <div>
                <strong>Verify your email</strong>
                <span>We sent a confirmation link to {user.email}.</span>
                {resendMessage && <span className="verify-msg">{resendMessage}</span>}
              </div>
              <button className="btn btn-sm" disabled={resending} onClick={resendVerification}>
                {resending ? 'Sending…' : 'Resend'}
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
