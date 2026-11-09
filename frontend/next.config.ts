import type { NextConfig } from 'next'

// The browser only talks to this app. Server Components and Server Actions call the
// NestJS API (BACKEND_URL, default http://localhost:4000) from the server, forwarding
// the session cookie, so the cookie stays first-party and no CORS or proxy rewrite is needed.
const config: NextConfig = {}

export default config
