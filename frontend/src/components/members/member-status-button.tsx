'use client'

import { useTransition } from 'react'
import type { Member } from '@/lib/types'
import { setMemberStatus } from '@/actions/members'

export function MemberStatusButton({ member, onError }: { member: Member; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition()
  const disabling = member.isActive

  const toggle = () => {
    if (disabling && !confirm(`Disable ${member.name}? They keep what they’ve already borrowed but can’t borrow until re-enabled.`)) return
    startTransition(async () => {
      const result = await setMemberStatus(member.id, !disabling)
      if (result.error) onError(result.error)
    })
  }

  return (
    <button type="button" className={`btn btn-sm${disabling ? ' btn-danger' : ''}`} disabled={pending} onClick={toggle}>
      {pending ? 'Saving…' : disabling ? 'Disable' : 'Enable'}
    </button>
  )
}
