'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { normalizeCode } from '@/lib/format'
import type { FormState } from '@/lib/types'
import { checkout, returnCopy } from '../actions'

// React's onChange fires for typing, paste, autofill and scanners alike.
const code = (setter: (value: string) => void) => (e: { target: { value: string } }) =>
  setter(normalizeCode(e.target.value))

function Result({ state }: { state: FormState }) {
  if (state.error) return <div className="banner banner-error">{state.error}</div>
  if (state.ok) return <div className="banner banner-ok">{state.ok}</div>
  return null
}

export function CheckoutForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, {})
  const [memberNo, setMemberNo] = useState('')
  const [barcode, setBarcode] = useState('')
  const barcodeInput = useRef<HTMLInputElement>(null)

  useEffect(() => barcodeInput.current?.focus(), [])
  // After an issue, keep the member and get ready for the next scan.
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
            <label className="label" htmlFor="memberNo">Member number</label>
            <input id="memberNo" name="memberNo" className="input code-input" placeholder="M001" value={memberNo} onChange={code(setMemberNo)} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="outBarcode">Copy barcode</label>
            <input id="outBarcode" name="barcode" ref={barcodeInput} className="input code-input" placeholder="B0001-1" value={barcode} onChange={code(setBarcode)} required />
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
        <p className="hint">Closes the active loan and puts the copy back into circulation.</p>
      </div>
    </section>
  )
}
