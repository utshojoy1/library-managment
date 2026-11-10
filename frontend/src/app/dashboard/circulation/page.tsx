import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import { daysUntil, formatDate } from '@/lib/format'
import { STAFF, type Loan, type Member } from '@/lib/types'
import { CheckoutForm, ReturnForm } from '@/components/circulation/circulation-forms'

export const metadata: Metadata = { title: 'Circulation' }

export default async function CirculationPage() {
  await requireRole(STAFF)
  const [loans, members] = await Promise.all([api<Loan[]>('/loans?limit=10'), api<Member[]>('/members')])

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Circulation</h1>
          <p>Pick a member, scan a copy and set the due date to issue it; scan a copy to return it.</p>
        </div>
      </header>

      <div className="split">
        <CheckoutForm members={members} />
        <ReturnForm />
      </div>

      <section className="card">
        <div className="card-head"><h2>Recent activity</h2></div>
        {!loans.length ? (
          <div className="empty">No borrows recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Returned</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.bookTitle}</strong></td>
                  <td>{loan.memberName}</td>
                  <td>{formatDate(loan.issuedAt)}</td>
                  <td>{formatDate(loan.dueAt)}</td>
                  <td>
                    {loan.status === 'returned' ? (
                      <span className="chip chip-gray">{formatDate(loan.returnedAt)}</span>
                    ) : daysUntil(loan.dueAt) < 0 ? (
                      <span className="chip chip-red">Overdue</span>
                    ) : (
                      <span className="chip chip-green">Borrowed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
