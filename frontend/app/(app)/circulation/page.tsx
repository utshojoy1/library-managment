'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, errorMessage, useApi } from '@/lib/api'
import { daysUntil, formatDate, normalizeCode, type Loan } from '@/lib/format'

type Result = { error: string; ok: string }
const CLEAR: Result = { error: '', ok: '' }

export default function CirculationPage() {
  const { data: loans, refresh } = useApi<Loan[]>('/loans?limit=10')
  const [memberNo, setMemberNo] = useState('')
  const [outBarcode, setOutBarcode] = useState('')
  const [inBarcode, setInBarcode] = useState('')
  const [busyOut, setBusyOut] = useState(false)
  const [busyIn, setBusyIn] = useState(false)
  const [out, setOut] = useState(CLEAR)
  const [back, setBack] = useState(CLEAR)
  const barcodeInput = useRef<HTMLInputElement>(null)

  useEffect(() => barcodeInput.current?.focus(), [])

  async function issue(e: FormEvent) {
    e.preventDefault()
    setBusyOut(true)
    setOut(CLEAR)
    try {
      const res = await api<{ bookTitle: string; memberName: string; dueAt: string }>('/loans/checkout', {
        method: 'POST',
        body: { memberNo, barcode: outBarcode },
      })
      setOut({ error: '', ok: `Issued “${res.bookTitle}” to ${res.memberName} — due ${formatDate(res.dueAt)}.` })
      setOutBarcode('')
      await refresh()
      barcodeInput.current?.focus()
    } catch (err) {
      setOut({ error: errorMessage(err), ok: '' })
    } finally {
      setBusyOut(false)
    }
  }

  async function giveBack(e: FormEvent) {
    e.preventDefault()
    setBusyIn(true)
    setBack(CLEAR)
    try {
      const res = await api<{ bookTitle: string; daysLate: number }>('/loans/return', {
        method: 'POST',
        body: { barcode: inBarcode },
      })
      setBack({
        error: '',
        ok: res.daysLate
          ? `Returned “${res.bookTitle}” — ${res.daysLate} day(s) late.`
          : `Returned “${res.bookTitle}” on time.`,
      })
      setInBarcode('')
      await refresh()
    } catch (err) {
      setBack({ error: errorMessage(err), ok: '' })
    } finally {
      setBusyIn(false)
    }
  }

  // React's onChange fires for typing, paste, autofill and scanners alike.
  const code = (setter: (value: string) => void) => (e: { target: { value: string } }) =>
    setter(normalizeCode(e.target.value))

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Circulation</h1>
          <p>Scan or type a barcode to issue or return a copy.</p>
        </div>
      </header>

      <div className="split">
        <section className="card">
          <div className="card-head"><h2>Check out</h2></div>
          <div className="card-body">
            {out.error && <div className="banner banner-error">{out.error}</div>}
            {out.ok && <div className="banner banner-ok">{out.ok}</div>}

            <form onSubmit={issue}>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="label" htmlFor="memberNo">Member number</label>
                <input id="memberNo" className="input code-input" placeholder="M001" value={memberNo} onChange={code(setMemberNo)} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="outBarcode">Copy barcode</label>
                <input id="outBarcode" ref={barcodeInput} className="input code-input" placeholder="B0001-1" value={outBarcode} onChange={code(setOutBarcode)} required />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={busyOut}>
                  {busyOut ? 'Issuing…' : 'Issue book'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Return</h2></div>
          <div className="card-body">
            {back.error && <div className="banner banner-error">{back.error}</div>}
            {back.ok && <div className="banner banner-ok">{back.ok}</div>}

            <form onSubmit={giveBack}>
              <div className="field">
                <label className="label" htmlFor="inBarcode">Copy barcode</label>
                <input id="inBarcode" className="input code-input" placeholder="B0001-1" value={inBarcode} onChange={code(setInBarcode)} required />
              </div>
              <div className="actions">
                <button type="submit" className="btn" disabled={busyIn}>
                  {busyIn ? 'Returning…' : 'Return book'}
                </button>
              </div>
            </form>
            <p className="hint">Closes the active loan and puts the copy back into circulation.</p>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Recent activity</h2></div>
        {!loans?.length ? (
          <div className="empty">No loans recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Returned</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td><strong>{loan.bookTitle}</strong></td>
                  <td>{loan.memberName}</td>
                  <td>{formatDate(loan.issuedAt)}</td>
                  <td>{formatDate(loan.dueAt)}</td>
                  <td>
                    {loan.status === 'returned' ? (
                      <span className="chip chip-gray">{formatDate(loan.returnedAt)}</span>
                    ) : daysUntil(loan.dueAt) < 0 ? (
                      <span className="chip chip-red">Overdue</span>
                    ) : (
                      <span className="chip chip-green">On loan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
