<script setup lang="ts">
const route = useRoute()
const { user, isStaff, isSuperAdmin } = useAuth()

const allLinks = [
  { to: '/', label: 'Dashboard', icon: 'grid', show: true },
  { to: '/catalog', label: 'Catalog', icon: 'book', show: true },
  { to: '/members', label: 'Members', icon: 'users', show: isStaff.value },
  { to: '/circulation', label: 'Circulation', icon: 'swap', show: isStaff.value },
  { to: '/admin/users', label: 'Users', icon: 'shield', show: isSuperAdmin.value },
]

const links = computed(() => allLinks.filter((link) => link.show))

const initials = computed(() =>
  (user.value?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  useAuthUser().value = null
  await navigateTo('/login')
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">L</span>
        <div>
          <strong>Libraria</strong>
          <small>Library manager</small>
        </div>
      </div>

      <nav class="nav">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ active: isActive(link.to) }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="link.icon === 'grid'">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </template>
            <template v-else-if="link.icon === 'book'">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </template>
            <template v-else-if="link.icon === 'users'">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </template>
            <template v-else-if="link.icon === 'swap'">
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </template>
            <template v-else>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </template>
          </svg>
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <div class="user-box">
        <div class="avatar">{{ initials }}</div>
        <div class="user-meta">
          <strong>{{ user?.name }}</strong>
          <span class="chip chip-gray">{{ ROLE_LABELS[user?.role ?? 'member'] }}</span>
        </div>
        <button class="icon-btn" title="Sign out" aria-label="Sign out" @click="signOut">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>

    <main class="main">
      <div class="container">
        <slot />
      </div>
    </main>
  </div>
</template>
