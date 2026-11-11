import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityList } from '@/components/app-shell/activity-list'
import { PageSizeSelect } from '@/components/app-shell/page-size-select'
import { apiResponse } from '@/lib/api'
import { requireRole } from '@/lib/dal'
import { STAFF, type Activity } from '@/lib/types'

export const metadata: Metadata = { title: 'Activity' }

const SIZES = [20, 50, 80, 100, 200] // the API caps a page at 200
const DEFAULT_SIZE = 80

/** Page numbers to show: first, last, and two either side of the current one; null marks a gap. */
function pageNumbers(current: number, last: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || Math.abs(p - current) <= 2) out.push(p)
    else if (out.at(-1) !== null) out.push(null)
  }
  return out
}

async function loadPage(size: number, page: number) {
  try {
    const res = await apiResponse(`/stats/activity?limit=${size}&offset=${(page - 1) * size}`)
    return { items: (await res.json()) as Activity[], total: Number(res.headers.get('x-total-count') ?? 0) }
  } catch {
    return null
  }
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; size?: string }> }) {
  await requireRole(STAFF)
  const params = await searchParams
  const size = SIZES.includes(Number(params.size)) ? Number(params.size) : DEFAULT_SIZE
  const requested = Math.max(1, Math.floor(Number(params.page)) || 1)

  const data = await loadPage(size, requested)
  const last = Math.max(1, Math.ceil((data?.total ?? 0) / size))
  const page = Math.min(requested, last)
  // A page past the end (e.g. after shrinking the log) shows the last page instead of an empty list.
  const view = page === requested ? data : await loadPage(size, page)
  const href = (p: number) => `?page=${p}&size=${size}`
  const from = view && view.total ? (page - 1) * size + 1 : 0
  const to = view ? Math.min(page * size, view.total) : 0

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Activity</h1>
          <p>Every logged change to books, members and loans, and who made each one.</p>
        </div>
      </header>

      <section className="card card-body">
        {view ? <ActivityList items={view.items} /> : <p className="activity-empty">Activity couldn’t be loaded. Try again shortly.</p>}
      </section>

      {view && view.total > 0 && (
        <nav className="pagination" aria-label="Activity pages">
          <span className="pagination-info">
            {from}–{to} of {view.total}
          </span>

          <div className="pagination-pages">
            {page > 1 ? <Link className="btn btn-sm" href={href(page - 1)}>‹ Prev</Link> : <span className="btn btn-sm" aria-disabled="true">‹ Prev</span>}
            {pageNumbers(page, last).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="pagination-gap">…</span>
              ) : (
                <Link key={p} href={href(p)} className={`btn btn-sm${p === page ? ' btn-primary' : ''}`} aria-current={p === page ? 'page' : undefined}>
                  {p}
                </Link>
              ),
            )}
            {page < last ? <Link className="btn btn-sm" href={href(page + 1)}>Next ›</Link> : <span className="btn btn-sm" aria-disabled="true">Next ›</span>}
          </div>

          <PageSizeSelect size={size} options={SIZES} />
        </nav>
      )}
    </div>
  )
}
