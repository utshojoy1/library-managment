import 'server-only'
import { cookies } from 'next/headers'

/** The NestJS API. Only the Next.js server talks to it; the browser never does. */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'

/** Set by the API on login/register; this app re-issues it as its own first-party cookie. */
export const SESSION_COOKIE = 'library_session'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/** Raw call to the API, forwarding the signed-in user's session cookie. */
export async function apiResponse(path: string, init: { method?: string; body?: unknown } = {}) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(session ? { cookie: `${SESSION_COOKIE}=${session}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    // Validation errors arrive as a list; the first one is enough for a form.
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message
    throw new ApiError(res.status, message || 'Something went wrong')
  }
  return res
}

/** Calls the API and returns its JSON body; throws ApiError with the server's message. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  return (await apiResponse(path, init)).json() as Promise<T>
}

/** For Server Actions: an API refusal becomes a message for the form; anything else still throws. */
export function formError(error: unknown) {
  if (error instanceof ApiError) return { error: error.message }
  throw error
}

/**
 * Copies the session cookie from the API's Set-Cookie onto this app's response.
 * Only call from a Server Action — cookies can't be set while rendering.
 */
export async function adoptSessionCookie(res: Response) {
  const header = res.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  if (!header) return

  const [pair = '', ...attributes] = header.split(';')
  const attrs = new Map(
    attributes.map((a) => {
      const [key = '', value = ''] = a.trim().split('=')
      return [key.toLowerCase(), value] as const
    }),
  )
  const maxAge = attrs.get('max-age')

  ;(await cookies()).set(SESSION_COOKIE, decodeURIComponent(pair.slice(pair.indexOf('=') + 1)), {
    httpOnly: attrs.has('httponly'),
    secure: attrs.has('secure'),
    sameSite: (attrs.get('samesite')?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined) ?? 'lax',
    path: attrs.get('path') || '/',
    ...(maxAge ? { maxAge: Number(maxAge) } : {}),
  })
}
