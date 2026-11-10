import Link from 'next/link'
import { api } from '@/lib/api'
import type { Activity } from '@/lib/types'

const VERB: Record<Activity['type'], string> = {
  book_added: 'Book added',
  member_joined: 'Member joined',
  issued: 'Issued',
  returned: 'Returned',
}

function ago(at: string) {
  const mins = Math.round((Date.now() - new Date(at).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days}d ago` : new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Staff only (the API enforces it). Null when the feed can't load, so it never takes a page down with it. */
export function getActivity(limit: number) {
  return api<Activity[]>(`/stats/activity?limit=${limit}`).catch(() => null)
}

/** Books added, members joined, issues and returns — newest first. */
export function ActivityList({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="activity-empty">Nothing yet.</p>
  return (
    <ol className="activity-list">
      {items.map((item, i) => {
        const text = (
          <>
            <span className={`activity-dot dot-${item.type}`} aria-hidden="true" />
            <span className="activity-text">
              <span className="activity-verb">{VERB[item.type]}</span>{' '}
              <strong>{item.subject}</strong>
              {item.detail && (
                <span className="activity-detail">
                  {item.type === 'issued' ? ' to ' : item.type === 'returned' ? ' by ' : ' · '}
                  {item.detail}
                </span>
              )}
              <time dateTime={item.at} title={new Date(item.at).toLocaleString('en-GB')}>{ago(item.at)}</time>
            </span>
          </>
        )
        return (
          <li key={`${item.type}-${item.at}-${i}`}>
            {item.bookId ? <Link href={`/dashboard/catalog/${item.bookId}`}>{text}</Link> : <div>{text}</div>}
          </li>
        )
      })}
    </ol>
  )
}
