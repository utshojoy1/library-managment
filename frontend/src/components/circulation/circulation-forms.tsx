'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { normalizeCode } from '@/lib/format'
import type { FormState, Member } from '@/lib/types'
import { checkout, returnCopy } from '@/actions/loans'

// React's onChange fires for typing, paste, autofill and scanners alike.
const code = (setter: (value: string) => void) => (e: { target: { value: string } }) =>
  setter(normalizeCode(e.target.value))

function Result({ state }: { state: FormState }) {
  if (state.error) return <div className="banner banner-error">{state.error}</div>
  if (state.ok) return <div className="banner banner-ok">{state.ok}</div>
  return null
}

/** YYYY-MM-DD in the browser's local time (what <input type="date"> expects). */
function localDate(daysFromToday: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CheckoutForm({ members }: { members: Pick<Member, 'memberNo' | 'name' | 'isActive'>[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, {})
  const [memberNo, setMemberNo] = useState('')
  const [barcode, setBarcode] = useState('')
  // Matches the API's default loan period; staff can pick any day up to 90 days out.
  const [dueDate, setDueDate] = useState(() => localDate(14))
  const barcodeInput = useRef<HTMLInputElement>(null)
  const selected = members.find((m) => m.memberNo === memberNo.trim())

  useEffect(() => barcodeInput.current?.focus(), [])
  // After an issue, keep the member and due date and get ready for the next scan.
  useEffect(() => {
    if (!state.ok) return
    setBarcode('')
    barcodeInput.current?.focus()
  }, [state])

  return (
    <section className="card">
      <div className="card-head"><h2>Check out</h2></div>
      <div className="card-body">
        <Result state={state} />
        <form action={action}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label" htmlFor="memberNo">Member</label>
            {/* Type a number or name to pick from the list; scanning a card number still works. */}
            <input id="memberNo" name="memberNo" className="input code-input" list="member-options" placeholder="M001 or a name" value={memberNo} onChange={(e) => setMemberNo(e.target.value.toUpperCase())} required autoComplete="off" />
            <datalist id="member-options">
              {members.filter((m) => m.isActive).map((m) => (
                <option key={m.memberNo} value={m.memberNo}>{m.name}</option>
              ))}
            </datalist>
            {memberNo.trim() && (
              <p className="hint" aria-live="polite">
                {selected ? (selected.isActive ? selected.name : `${selected.name} — membership inactive`) : 'No member with this number'}
              </p>
            )}
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label" htmlFor="outBarcode">Copy barcode</label>
            <input id="outBarcode" name="barcode" ref={barcodeInput} className="input code-input" placeholder="B0001-1" value={barcode} onChange={code(setBarcode)} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="dueDate">Due date</label>
            <input id="dueDate" name="dueDate" type="date" className="input" min={localDate(0)} max={localDate(90)} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Issuing…' : 'Issue book'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export function ReturnForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(returnCopy, {})
  const [barcode, setBarcode] = useState('')

  useEffect(() => {
    if (state.ok) setBarcode('')
  }, [state])

  return (
    <section className="card">
      <div className="card-head"><h2>Return</h2></div>
      <div className="card-body">
        <Result state={state} />
        <form action={action}>
          <div className="field">
            <label className="label" htmlFor="inBarcode">Copy barcode</label>
            <input id="inBarcode" name="barcode" className="input code-input" placeholder="B0001-1" value={barcode} onChange={code(setBarcode)} required />
          </div>
          <div className="actions">
            <button type="submit" className="btn" disabled={pending}>
              {pending ? 'Returning…' : 'Return book'}
            </button>
          </div>
        </form>
        <p className="hint">Ends the active borrow and puts the copy back into circulation.</p>
      </div>
    </section>
  )
}
