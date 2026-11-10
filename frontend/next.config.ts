import type { NextConfig } from 'next'

// The browser only talks to this app. Server Components and Server Actions call the
// NestJS API (BACKEND_URL, default http://localhost:4000) from the server, forwarding
// the session cookie, so the cookie stays first-party and no CORS or proxy rewrite is needed.
const config: NextConfig = {
  // Pages moved under /auth and /dashboard; keep old bookmarks and already-sent email links working.
  async redirects() {
    return [
      { source: '/:page(login|register|forgot-password|reset-password|verify-email)', destination: '/auth/:page', permanent: true },
      { source: '/:page(catalog|members|circulation|admin)/:rest*', destination: '/dashboard/:page/:rest*', permanent: true },
    ]
  },
}

export default config
