import type { NextConfig } from 'next'

// The browser only ever talks to this app; /api/* is proxied to NestJS so the
// session cookie stays first-party and no CORS is needed.
const backend = process.env.BACKEND_URL ?? 'http://localhost:4000'

const config: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
}

export default config
