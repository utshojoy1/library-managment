import type { ReactNode } from 'react'
import { verifySession } from '@/lib/dal'
import { ROLE_LABELS } from '@/lib/format'
import { STAFF } from '@/lib/types'
import { signOut } from '@/actions/session'
import { NavLinks, type NavItem } from '@/components/app-shell/nav-links'
import { VerifyBanner } from '@/components/app-shell/verify-banner'

/**
 * Signed-in shell. The session is read here for the sidebar; each page checks it
 * (and its role) again, because layouts don't re-render on client navigation.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await verifySession()
  const isStaff = STAFF.includes(user.role)

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/dashboard/catalog', label: 'Catalog', icon: 'book' },
    ...(isStaff
      ? ([
          { to: '/dashboard/members', label: 'Members', icon: 'users' },
          { to: '/dashboard/circulation', label: 'Circulation', icon: 'swap' },
          { to: '/dashboard/activity', label: 'Activity', icon: 'activity' },
        ] satisfies NavItem[])
      : []),
    ...(user.role === 'super_admin' ? ([{ to: '/dashboard/admin/users', label: 'Users', icon: 'shield' }] satisfies NavItem[]) : []),
  ]

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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

        <NavLinks items={items} />

        <div className="user-box">
          <div className="avatar">{initials}</div>
          <div className="user-meta">
            <strong>{user.name}</strong>
            <span className="chip chip-gray">{ROLE_LABELS[user.role]}</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="icon-btn" title="Sign out" aria-label="Sign out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          {!user.emailVerified && <VerifyBanner email={user.email} />}
          {children}
        </div>
      </main>
    </div>
  )
}
