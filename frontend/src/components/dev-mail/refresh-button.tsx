'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/** Re-renders the server page to pick up new messages. */
export function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button className="btn btn-sm" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
