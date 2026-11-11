import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import { formatDate, VERB } from '@/lib/format'
import { STAFF, type Activity, type Book, type Member } from '@/lib/types'
import { getActivity } from '@/components/app-shell/activity-list'
import { CheckoutForm, type CopyOption, ReturnForm } from '@/components/circulation/circulation-forms'

export const metadata: Metadata = { title: 'Circulation' }

const EVENT_CHIP: Partial<Record<Activity['type'], string>> = {
  issued: 'chip-green',
  returned: 'chip-gray',
  book_added: 'chip-indigo',
  book_updated: 'chip-amber',
  book_deleted: 'chip-red',
}

export default async function CirculationPage() {
  await requireRole(STAFF)
  const [activity, members, books] = await Promise.all([getActivity(10, 'books'), api<Member[]>('/members'), api<Book[]>('/books')])
  const copies: CopyOption[] = books.flatMap((b) => b.copies.map((c) => ({ ...c, title: b.title, author: b.author })))

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Circulation</h1>
          <p>Pick a member, scan a copy and set the due date to issue it; scan a copy to return it.</p>
        </div>
      </header>

      <div className="split">
        <CheckoutForm members={members} copies={copies} />
        <ReturnForm copies={copies} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recent activity</h2>
          <Link href="/dashboard/activity" className="link-sm">View all</Link>
        </div>
        {!activity ? (
          <div className="empty">Activity couldn’t be loaded. Try again shortly.</div>
        ) : !activity.length ? (
          <div className="empty">No book activity recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Event</th>
                <th>Member / details</th>
                <th>By</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item, i) => (
                <tr key={`${item.type}-${item.at}-${i}`}>
                  <td>
                    {item.bookId ? (
                      <Link href={`/dashboard/catalog/${item.bookId}`}><strong>{item.subject}</strong></Link>
                    ) : (
                      <strong>{item.subject}</strong>
                    )}
                  </td>
                  <td><span className={`chip ${EVENT_CHIP[item.type] ?? 'chip-gray'}`}>{VERB[item.type] ?? item.type}</span></td>
                  <td>{item.detail ?? '—'}</td>
                  <td>{item.actor ?? '—'}</td>
                  <td title={new Date(item.at).toLocaleString('en-GB')}>{formatDate(item.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
