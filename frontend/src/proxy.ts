import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'library_session'

/** Pages anyone can open. Everything else needs a session. */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/dev/mail']

/**
 * Optimistic check only: is there a session cookie at all? It runs on prefetches too,
 * so it never calls the API. Pages verify the session for real through lib/dal.ts.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (PUBLIC_PATHS.includes(pathname) || req.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const login = new URL('/auth/login', req.nextUrl)
  login.searchParams.set('redirect', pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  // Skip Next.js internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp)$).*)'],
}
