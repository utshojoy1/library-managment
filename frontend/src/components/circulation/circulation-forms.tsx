'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { FormState, Member } from '@/lib/types'
import { checkout, returnCopy } from '@/actions/loans'

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

export type CopyOption = { barcode: string; status: string; title: string; author: string }

/**
 * Book code input with the same pick-from-list + live hint as the member field.
 * `want` is the status a copy must have for this form: available to issue, on_loan to return.
 */
function BookCodeField({
  id,
  copies,
  want,
  value,
  onChange,
  inputRef,
}: {
  id: string
  copies: CopyOption[]
  want: 'available' | 'on_loan'
  value: string
  onChange: (value: string) => void
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const query = value.trim()
  const match = copies.find((c) => c.barcode === query)
  const listId = `${id}-options`
  // Empty until something is typed, so focusing the field doesn't dump every copy.
  const suggestions = query
    ? copies.filter((c) => c.status === want && (c.barcode.includes(query) || c.title.toUpperCase().includes(query))).slice(0, 8)
    : []
  return (
    <>
      <label className="label" htmlFor={id}>Book code</label>
      <input id={id} name="barcode" ref={inputRef} className="input code-input" list={listId} placeholder="B0001-1 or a title" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} required autoComplete="off" />
      <datalist id={listId}>
        {suggestions.map((c) => (
          <option key={c.barcode} value={c.barcode}>{`${c.title} — ${c.author}`}</option>
        ))}
      </datalist>
      {value.trim() && (
        <p className="hint" aria-live="polite">
          {!match
            ? 'No book with this code'
            : match.status === want
              ? `${match.title} — ${match.author}`
              : `${match.title} — ${want === 'available' ? 'already borrowed' : 'not borrowed'}`}
        </p>
      )}
    </>
  )
}

export function CheckoutForm({ members, copies }: { members: Pick<Member, 'memberNo' | 'name' | 'isActive'>[]; copies: CopyOption[] }) {
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
            <BookCodeField id="outBarcode" copies={copies} want="available" value={barcode} onChange={setBarcode} inputRef={barcodeInput} />
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

export function ReturnForm({ copies }: { copies: CopyOption[] }) {
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
            <BookCodeField id="inBarcode" copies={copies} want="on_loan" value={barcode} onChange={setBarcode} />
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
