'use client'

import { useEffect, useRef, useState } from 'react'
import type { Activity } from '@/lib/types'
import { latestActivity } from '@/actions/activity'
import { VERB } from '@/lib/format'

const POLL_MS = 15_000
const SHOW_MS = 6_000
const MAX_TOASTS = 3

type Toast = Activity & { key: string }

/**
 * Pops up new activity-log entries at the top of the screen as they happen.
 * shortcut: polls every 15s rather than pushing; switch to SSE/websocket if it must be instant.
 */
export function ActivityToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Newest entry already seen; null until the first load sets the baseline (so old entries never pop up).
  const seen = useRef<number | null>(null)

  useEffect(() => {
    let stopped = false

    const check = async () => {
      if (document.hidden) return
      const items = await latestActivity()
      if (stopped || !items?.length) return
      const newest = Math.max(...items.map((i) => new Date(i.at).getTime()))
      if (seen.current !== null) {
        const fresh = items
          .filter((i) => new Date(i.at).getTime() > seen.current!)
          .reverse() // oldest first, so the latest ends up on top
          .map((i) => ({ ...i, key: `${i.type}-${i.at}-${i.subject}` }))
        if (fresh.length) {
          setToasts((current) => [...fresh, ...current].slice(-MAX_TOASTS))
          for (const t of fresh) setTimeout(() => setToasts((c) => c.filter((x) => x.key !== t.key)), SHOW_MS)
        }
      }
      seen.current = Math.max(newest, seen.current ?? 0)
    }

    check()
    const timer = setInterval(check, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} className="toast" role="status">
          <span className={`activity-dot dot-${t.type}`} aria-hidden="true" />
          <div className="toast-text">
            <span className="activity-verb">{VERB[t.type] ?? t.type}</span> <strong>{t.subject}</strong>
            {t.detail && <span className="activity-detail"> · {t.detail}</span>}
            {t.actor && <span className="activity-meta">by {t.actor}</span>}
          </div>
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => setToasts((c) => c.filter((x) => x.key !== t.key))}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
