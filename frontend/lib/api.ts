'use client'

import { useCallback, useEffect, useState } from 'react'

/** Calls the NestJS API through the /api proxy; throws an Error with the server's message. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message
    throw new Error(message || 'Something went wrong')
  }
  return data as T
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

/** GETs `path` on mount (skipped when null) and exposes `refresh` for after a write. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!path) return
    try {
      setData(await api<T>(path))
      setError('')
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [path])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, error, refresh }
}
