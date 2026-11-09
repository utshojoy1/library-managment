import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-card">
          <h1>Page not found</h1>
          <p className="sub">There is nothing at this address.</p>
          <Link href="/" className="btn btn-primary auth-submit">Go to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
