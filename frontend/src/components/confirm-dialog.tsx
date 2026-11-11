'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

type Options = { title: string; message: string; confirmLabel?: string; danger?: boolean }

/**
 * In-app replacement for window.confirm(). Render `dialog` once, then `await confirm({...})`.
 * Built on <dialog>.showModal(), which gives Esc-to-cancel, focus trapping and the backdrop for free.
 */
export function useConfirm() {
  const ref = useRef<HTMLDialogElement>(null)
  const resolver = useRef<(ok: boolean) => void>(null)
  const [options, setOptions] = useState<Options | null>(null)

  const confirm = (opts: Options) => {
    // Render the new text/colours before opening, or the old ones flash for a frame.
    flushSync(() => setOptions(opts))
    // returnValue survives between openings, and Esc doesn't overwrite it — reset so Esc means cancel.
    if (ref.current) ref.current.returnValue = ''
    ref.current?.showModal()
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }

  // Every way of closing (buttons, Esc, backdrop) goes through the native close event.
  const onClose = () => {
    resolver.current?.(ref.current?.returnValue === 'ok')
    resolver.current = null
  }

  const dialog = (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close('cancel')}
    >
      <form method="dialog">
        <h2 id="confirm-title">{options?.title}</h2>
        <p>{options?.message}</p>
        <div className="confirm-actions">
          <button type="submit" value="cancel" className="btn" autoFocus>Cancel</button>
          <button type="submit" value="ok" className={`btn ${options?.danger ? 'btn-danger-solid' : 'btn-primary'}`}>
            {options?.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </form>
    </dialog>
  )

  return { confirm, dialog }
}
