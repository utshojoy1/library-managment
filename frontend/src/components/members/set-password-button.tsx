'use client'

import { useActionState, useRef, useState } from 'react'
import type { FormState, Member } from '@/lib/types'
import { setMemberPassword } from '@/actions/members'
import { PasswordInput } from '@/components/auth/password-input'

/** Any staff; only a super admin may reset a staff-linked account (the API enforces it). */
export function SetPasswordButton({ member }: { member: Member }) {
  const dialog = useRef<HTMLDialogElement>(null)
  // Bumped on every open so the form (and its success/error message) starts fresh.
  const [round, setRound] = useState(0)
  const titleId = `pw-title-${member.id}`

  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => {
          setRound((r) => r + 1)
          dialog.current?.showModal()
        }}
      >
        Password
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={titleId}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
      >
        <PasswordForm key={round} member={member} titleId={titleId} onClose={() => dialog.current?.close()} />
      </dialog>
    </>
  )
}

function PasswordForm({ member, titleId, onClose }: { member: Member; titleId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setMemberPassword.bind(null, member.id), {})

  return (
    <form action={action}>
      <h2 id={titleId}>Set password</h2>
      <p>
        New login password for {member.name} ({member.memberNo}). They’ll be signed out of every device.
      </p>
      {state.error && <div className="banner banner-error" role="alert" style={{ marginTop: 12 }}>{state.error}</div>}
      {state.ok && <div className="banner banner-ok" role="status" style={{ marginTop: 12 }}>{state.ok}</div>}
      {!state.ok && (
        <div className="field" style={{ marginTop: 14 }}>
          <label className="label" htmlFor={`pw-${member.id}`}>New password</label>
          <PasswordInput id={`pw-${member.id}`} name="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
      )}
      <div className="confirm-actions">
        <button type="button" className="btn" onClick={onClose}>
          {state.ok ? 'Close' : 'Cancel'}
        </button>
        {!state.ok && (
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving…' : 'Set password'}
          </button>
        )}
      </div>
    </form>
  )
}
