'use client'

import Link from 'next/link'
import { useApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { daysUntil, formatDate, type Loan } from '@/lib/format'

type Stats = { books: number; copies: number; members: number; activeLoans: number; overdue: number }

export default function DashboardPage() {
  const { user, isStaff: staff } = useAuth()
  const { data: stats } = useApi<Stats>(staff ? '/stats' : null)
  const { data: loans } = useApi<Loan[]>(staff ? '/loans?status=active&limit=8' : '/loans/mine')

  const summary = stats ?? { books: 0, copies: 0, members: 0, activeLoans: 0, overdue: 0 }
  const firstName = user?.name.split(' ')[0] ?? 'there'

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

      {staff && (
        <section className="stats">
          <div className="stat"><span>Book titles</span><strong>{summary.books}</strong></div>
          <div className="stat"><span>Physical copies</span><strong>{summary.copies}</strong></div>
          <div className="stat"><span>Members</span><strong>{summary.members}</strong></div>
          <div className="stat">
            <span>On loan</span>
            <strong>{summary.activeLoans}</strong>
            {summary.overdue > 0 && <small className="stat-note">{summary.overdue} overdue</small>}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>{staff ? 'Active loans' : 'My loans'}</h2>
          {staff && summary.overdue > 0 && <span className="chip chip-red">{summary.overdue} overdue</span>}
        </div>

        {!loans?.length ? (
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
