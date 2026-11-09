'use client'

/** Unexpected failures inside the signed-in area (API down, bug). Expected errors are shown in forms instead. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && 'digest' in error ? String(error.digest) : null

  return (
    <div className="card">
      <div className="empty">
        <p>Something went wrong loading this page.</p>
        {digest && <p className="mono">Reference: {digest}</p>}
        <button className="btn btn-sm" onClick={retry}>Try again</button>
      </div>
    </div>
  )
}
