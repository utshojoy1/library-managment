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

  const isPublic = to.path === '/login' || to.path === '/register'

  if (isPublic) {
    if (user.value) return navigateTo('/')
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
