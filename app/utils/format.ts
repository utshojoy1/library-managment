export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function daysUntil(value: string | Date) {
  const ms = new Date(value).getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

export function apiError(error: unknown) {
  const e = error as { data?: { statusMessage?: string; message?: string }; statusMessage?: string }
  return e?.data?.statusMessage || e?.data?.message || e?.statusMessage || 'Something went wrong'
}
