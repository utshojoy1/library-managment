import { LoanStatus } from '@/components/loans/loan-status'
import { formatDate } from '@/lib/format'
import type { Loan } from '@/lib/types'

/** Loans card shared by the dashboard and circulation pages. */
export function BorrowsTable({
  title,
  loans,
  showMember,
  overdue,
  empty,
  className = '',
}: {
  title: string
  loans: Loan[]
  showMember: boolean
  overdue?: number
  empty: string
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <h2>{title}</h2>
        {!!overdue && <span className="chip chip-red">{overdue} overdue</span>}
      </div>

      {!loans.length ? (
        <div className="empty">{empty}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Book</th>
              {showMember && <th>Member</th>}
              <th>Book code</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>
                  <strong>{loan.bookTitle}</strong>
                  <div className="mono">{loan.author}</div>
                </td>
                {showMember && (
                  <td>
                    {loan.memberName}
                    <div className="mono">{loan.memberNo}</div>
                  </td>
                )}
                <td className="mono">{loan.barcode}</td>
                <td>{formatDate(loan.dueAt)}</td>
                <td>
                  <LoanStatus loan={loan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
