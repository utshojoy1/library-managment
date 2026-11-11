import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckoutForm, ReturnForm } from '@/components/circulation/circulation-forms'
import { LoanStatus } from '@/components/loans/loan-status'
import { api, ApiError } from '@/lib/api'
import { verifySession } from '@/lib/dal'
import { formatDate } from '@/lib/format'
import { STAFF, type Book, type Loan, type Member } from '@/lib/types'

export const metadata: Metadata = { title: 'Book details' }

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await verifySession()
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()

  const staff = STAFF.includes(user.role)
  // The borrow history names members, so only staff load it (the API enforces the same rule).
  const [book, ledger, members] = await Promise.all([
    api<Book>(`/books/${id}`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound()
      throw e
    }),
    staff ? api<Loan[]>(`/loans?bookId=${id}&limit=200`) : null,
    staff ? api<Member[]>('/members') : null,
  ])
  // Only this book's copies, so the book code suggestions stay on this title.
  const copies = book.copies.map((c) => ({ ...c, title: book.title, author: book.author }))

  return (
    <div>
      <Link href="/dashboard/catalog" className="link-sm back-link">← Back to catalog</Link>

      <header className="page-head">
        <div>
          <h1>{book.title}</h1>
          <p>{book.author}</p>
        </div>
        <span className={`chip ${book.available > 0 ? 'chip-green' : 'chip-red'}`}>
          {book.available} / {book.total} available
        </span>
      </header>

      <section className="card detail-card">
        <dl className="details">
          <div><dt>Category</dt><dd>{book.category ?? '—'}</dd></div>
          <div><dt>ISBN</dt><dd className="mono">{book.isbn ?? '—'}</dd></div>
          <div><dt>Published</dt><dd>{book.publishedYear ?? '—'}</dd></div>
          <div><dt>Copies</dt><dd>{book.total}</dd></div>
        </dl>
        {book.copies.length > 0 && (
          <div className="copy-codes">
            {book.copies.map((copy) => (
              <span
                key={copy.barcode}
                className={`copy-code${copy.status !== 'available' ? ' taken' : ''}`}
                title={copy.status === 'available' ? 'Available' : 'Borrowed'}
              >
                {copy.barcode}
              </span>
            ))}
          </div>
        )}
      </section>

      {members && (
        <div className="split">
          <CheckoutForm members={members} copies={copies} />
          <ReturnForm copies={copies} />
        </div>
      )}

      {ledger && (
        <section className="card">
          <div className="card-head">
            <h2>Borrow history</h2>
            <span className="toolbar-note">{ledger.length} {ledger.length === 1 ? 'borrow' : 'borrows'}</span>
          </div>
          {!ledger.length ? (
            <div className="empty">This book has never been borrowed.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book code</th>
                  <th>Member</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Returned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((loan) => (
                  <tr key={loan.id}>
                    <td className="mono">{loan.barcode}</td>
                    <td>
                      {loan.memberName}
                      <div className="mono">{loan.memberNo}</div>
                    </td>
                    <td>{formatDate(loan.issuedAt)}</td>
                    <td>{formatDate(loan.dueAt)}</td>
                    <td>{loan.returnedAt ? formatDate(loan.returnedAt) : '—'}</td>
                    <td>
                      <LoanStatus loan={loan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  )
}
