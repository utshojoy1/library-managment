import type { Metadata } from 'next'
import { ActivityList, getActivity } from '@/components/app-shell/activity-list'
import { requireRole } from '@/lib/dal'
import { STAFF } from '@/lib/types'

export const metadata: Metadata = { title: 'Activity' }

const LIMIT = 100

export default async function ActivityPage() {
  await requireRole(STAFF)
  const items = await getActivity(LIMIT)

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Activity</h1>
          <p>The latest {LIMIT} events: books added, members joined, books issued and returned.</p>
        </div>
      </header>

      <section className="card card-body">
        {items ? <ActivityList items={items} /> : <p className="activity-empty">Activity couldn’t be loaded. Try again shortly.</p>}
      </section>
    </div>
  )
}
