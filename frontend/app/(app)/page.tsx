import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { verifySession } from '@/lib/dal'
import { daysUntil, formatDate } from '@/lib/format'
import { STAFF, type Loan, type Stats } from '@/lib/types'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await verifySession()
  const staff = STAFF.includes(user.role)

  // Fetched in parallel; members only see their own loans.
  const [stats, loans] = await Promise.all([
    staff ? api<Stats>('/stats') : null,
    api<Loan[]>(staff ? '/loans?status=active&limit=8' : '/loans/mine'),
  ])
  const firstName = user.name.split(' ')[0]

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>{staff ? 'Dashboard' : `Welcome back, ${firstName}`}</h1>
          <p>
            {staff
              ? 'Today at a glance — catalog, members and what is out on loan.'
              : 'Your library account, current loans and due dates.'}
          </p>
        </div>
        {staff ? (
          <Link href="/circulation" className="btn btn-primary">Issue a book</Link>
        ) : (
          <Link href="/catalog" className="btn btn-primary">Browse catalog</Link>
        )}
      </header>

      {stats && (
        <section className="stats">
          <div className="stat"><span>Book titles</span><strong>{stats.books}</strong></div>
          <div className="stat"><span>Physical copies</span><strong>{stats.copies}</strong></div>
          <div className="stat"><span>Members</span><strong>{stats.members}</strong></div>
          <div className="stat">
            <span>On loan</span>
            <strong>{stats.activeLoans}</strong>
            {stats.overdue > 0 && <small className="stat-note">{stats.overdue} overdue</small>}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>{staff ? 'Active loans' : 'My loans'}</h2>
          {stats && stats.overdue > 0 && <span className="chip chip-red">{stats.overdue} overdue</span>}
        </div>

        {!loans.length ? (
          <div className="empty">
            {staff ? 'Nothing is out on loan right now.' : 'You have no loans yet — visit the catalog to find something.'}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                {staff && <th>Member</th>}
                <th>Copy</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const days = daysUntil(loan.dueAt)
                return (
                  <tr key={loan.id}>
                    <td>
                      <strong>{loan.bookTitle}</strong>
                      <div className="mono">{loan.author}</div>
                    </td>
                    {staff && (
                      <td>
                        {loan.memberName}
                        <div className="mono">{loan.memberNo}</div>
                      </td>
                    )}
                    <td className="mono">{loan.barcode}</td>
                    <td>{formatDate(loan.dueAt)}</td>
                    <td>
                      {loan.status === 'returned' ? (
                        <span className="chip chip-gray">Returned</span>
                      ) : days < 0 ? (
                        <span className="chip chip-red">Overdue {Math.abs(days)}d</span>
                      ) : days <= 3 ? (
                        <span className="chip chip-amber">Due in {days}d</span>
                      ) : (
                        <span className="chip chip-green">On time</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
