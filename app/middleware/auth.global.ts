export default defineNuxtRouteMiddleware(async (to) => {
  const user = useAuthUser()

  // Resolve the session once per app load (SSR-safe: forwards cookies).
  if (!user.value) {
    try {
      user.value = await useRequestFetch()('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/dev/mail',
  ]

  if (publicPaths.includes(to.path)) {
    // Signed-in users get bounced away from login/register, but not from the
    // password-reset and verification pages (they can be reached from an email).
    if (user.value && (to.path === '/login' || to.path === '/register')) {
      return navigateTo('/')
    }
    return
  }

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(user.value.role)) {
    return navigateTo('/')
  }
})
