/**
 * Resolves the session cookie once per request and exposes the user on
 * `event.context.user`. Route handlers then use `requireUser` / `requireRole`.
 */
export default defineEventHandler(async (event) => {
  const path = event.path

  // Skip static assets so a page load doesn't cost a query per file.
  if (
    path.startsWith('/_nuxt') ||
    path.startsWith('/__nuxt') ||
    path.startsWith('/favicon') ||
    /\.(?:css|js|map|png|jpg|jpeg|svg|ico|woff2?)$/.test(path)
  ) {
    return
  }

  const user = await getSessionUser(event)
  if (user) event.context.user = user
})
