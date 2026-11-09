import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import { daysUntil, formatDate } from '@/lib/format'
import { STAFF, type Loan } from '@/lib/types'
import { CheckoutForm, ReturnForm } from './_components/circulation-forms'

export const metadata: Metadata = { title: 'Circulation' }

export default async function CirculationPage() {
  await requireRole(STAFF)
  const loans = await api<Loan[]>('/loans?limit=10')

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Circulation</h1>
          <p>Scan or type a barcode to issue or return a copy.</p>
        </div>
      </header>

      <div className="split">
        <CheckoutForm />
        <ReturnForm />
      </div>

      <section className="card">
        <div className="card-head"><h2>Recent activity</h2></div>
        {!loans.length ? (
          <div className="empty">No loans recorded yet.</div>
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
                      <span className="chip chip-green">On loan</span>
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
