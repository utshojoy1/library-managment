import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityList, getActivity } from '@/components/app-shell/activity-list'
import { DonutChart, type Slice } from '@/components/dashboard/donut-chart'
import { api } from '@/lib/api'
import { verifySession } from '@/lib/dal'
import { BorrowsTable } from '@/components/loans/borrows-table'
import { STAFF, type Loan, type Stats } from '@/lib/types'

export const metadata: Metadata = { title: 'Dashboard' }

// Fixed categorical order (validated for color-blind separation); a 6th+ category folds into "Other".
const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']

function categorySlices(categories: Stats['categories']): Slice[] {
  const top = categories.slice(0, CATEGORY_COLORS.length)
  const other = categories.slice(CATEGORY_COLORS.length).reduce((sum, c) => sum + c.count, 0)
  const slices = top.map((c, i) => ({ label: c.name, value: c.count, color: CATEGORY_COLORS[i]! }))
  return other ? [...slices, { label: 'Other', value: other, color: '#9ca3af' }] : slices
}

export default async function DashboardPage() {
  const user = await verifySession()
  const staff = STAFF.includes(user.role)

  // Fetched in parallel; members only see their own loans.
  const [stats, loans, activity] = await Promise.all([
    staff ? api<Stats>('/stats') : null,
    api<Loan[]>(staff ? '/loans?status=active&limit=8' : '/loans/mine'),
    staff ? getActivity(8) : null,
  ])
  const firstName = user.name.split(' ')[0]

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>{staff ? 'Dashboard' : `Welcome back, ${firstName}`}</h1>
          <p>
            {staff
              ? 'Today at a glance — catalog, members and what is borrowed.'
              : 'Your library account, current borrows and due dates.'}
          </p>
        </div>
        {staff ? (
          <Link href="/dashboard/circulation" className="btn btn-primary">Issue a book</Link>
        ) : (
          <Link href="/dashboard/catalog" className="btn btn-primary">Browse catalog</Link>
        )}
      </header>

      {stats && (
        <section className="stats">
          <div className="stat"><span>Book titles</span><strong>{stats.books}</strong></div>
          <div className="stat"><span>Physical copies</span><strong>{stats.copies}</strong></div>
          <div className="stat"><span>Members</span><strong>{stats.members}</strong></div>
          <div className="stat">
            <span>Borrowed</span>
            <strong>{stats.activeLoans}</strong>
            {stats.overdue > 0 && <small className="stat-note">{stats.overdue} overdue</small>}
          </div>
        </section>
      )}

      {stats && (
        <div className="charts">
          <DonutChart
            title="Copies by status"
            unit="copies"
            slices={[
              { label: 'Available', value: stats.copies - stats.activeLoans, color: '#4f46e5' },
              { label: 'Borrowed', value: stats.activeLoans - stats.dueSoon - stats.overdue, color: '#067647' },
              { label: 'Due in 3 days', value: stats.dueSoon, color: '#eda100' },
              { label: 'Overdue', value: stats.overdue, color: '#b42318' },
            ]}
          />
          <DonutChart title="Books by category" unit="titles" slices={categorySlices(stats.categories)} />
        </div>
      )}

      <div className="charts">
      {activity && (
        <section className="card">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link href="/dashboard/activity" className="link-sm">View all</Link>
          </div>
          <div className="card-body">
            <ActivityList items={activity} />
          </div>
        </section>
      )}

      <BorrowsTable
        className="dash-borrows"
        title={staff ? 'Active borrows' : 'My borrows'}
        loans={loans}
        showMember={staff}
        overdue={stats?.overdue}
        empty={staff ? 'Nothing is borrowed right now.' : 'You haven’t borrowed anything yet — visit the catalog to find something.'}
      />
      </div>
    </div>
  )
}
