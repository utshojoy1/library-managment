import Link from 'next/link'
import { api } from '@/lib/api'
import { VERB } from '@/lib/format'
import type { Activity } from '@/lib/types'

function ago(at: string) {
  const mins = Math.round((Date.now() - new Date(at).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days}d ago` : new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** True when the entry is about a book/member that has since been deleted (the delete entry itself says so already). */
function isRemoved(item: Activity) {
  if (item.type.startsWith('member_')) return item.type !== 'member_deleted' && item.memberId === null
  if (item.type.startsWith('book_')) return item.type !== 'book_deleted' && item.bookId === null
  return false
}

/** Staff only (the API enforces it). Null when the feed can't load, so it never takes a page down with it. */
export function getActivity(limit: number, scope?: 'books') {
  return api<Activity[]>(`/stats/activity?limit=${limit}${scope ? `&scope=${scope}` : ''}`).catch(() => null)
}

/** Every logged change — books, members, issues and returns — newest first, with who did it. */
export function ActivityList({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="activity-empty">Nothing yet.</p>
  return (
    <ol className="activity-list">
      {items.map((item, i) => {
        const text = (
          <>
            <span className={`activity-dot dot-${item.type}`} aria-hidden="true" />
            <span className="activity-text">
              <span className="activity-verb">{VERB[item.type] ?? item.type}</span>{' '}
              <strong>{item.subject}</strong>
              {isRemoved(item) && <span className="activity-removed"> (removed)</span>}
              {item.detail && (
                <span className="activity-detail">
                  {item.type === 'issued' ? ' to ' : item.type === 'returned' ? ' by ' : ' · '}
                  {item.detail}
                </span>
              )}
              <span className="activity-meta">
                <time dateTime={item.at} title={new Date(item.at).toLocaleString('en-GB')}>{ago(item.at)}</time>
                {item.actor && <> · by {item.actor}</>}
              </span>
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
