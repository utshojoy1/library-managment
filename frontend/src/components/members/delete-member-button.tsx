'use client'

import { useTransition } from 'react'
import type { Member } from '@/lib/types'
import { deleteMember } from '@/actions/members'
import { useConfirm } from '@/components/confirm-dialog'

export function DeleteMemberButton({ member, onError }: { member: Member; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete member?',
      message: `${member.name} (${member.memberNo}) will be permanently removed. This can’t be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteMember(member.id)
      if (result.error) onError(result.error)
    })
  }

  return (
    <>
      <button type="button" className="btn btn-sm btn-danger" disabled={pending} onClick={remove}>
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {dialog}
    </>
  )
}
