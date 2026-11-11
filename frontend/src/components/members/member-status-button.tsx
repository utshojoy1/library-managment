'use client'

import { useTransition } from 'react'
import type { Member } from '@/lib/types'
import { setMemberStatus } from '@/actions/members'
import { useConfirm } from '@/components/confirm-dialog'

export function MemberStatusButton({ member, onError }: { member: Member; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()
  const disabling = member.isActive

  const toggle = async () => {
    if (
      disabling &&
      !(await confirm({
        title: 'Disable member?',
        message: `${member.name} keeps what they’ve already borrowed but can’t borrow until re-enabled.`,
        confirmLabel: 'Disable',
        danger: true,
      }))
    ) {
      return
    }
    startTransition(async () => {
      const result = await setMemberStatus(member.id, !disabling)
      if (result.error) onError(result.error)
    })
  }

  return (
    <>
      <button type="button" className={`btn btn-sm${disabling ? ' btn-danger' : ''}`} disabled={pending} onClick={toggle}>
        {pending ? 'Saving…' : disabling ? 'Disable' : 'Enable'}
      </button>
      {dialog}
    </>
  )
}
