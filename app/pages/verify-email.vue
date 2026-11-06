<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const state = ref<'verifying' | 'done' | 'error'>('verifying')
const message = ref('')

onMounted(async () => {
  const token = String(route.query.token ?? '')
  if (!token) {
    state.value = 'error'
    message.value = 'This link is missing its token.'
    return
  }

  try {
    await $fetch('/api/auth/verify-email', { method: 'POST', body: { token } })
    state.value = 'done'
    // Refresh the cached session so the "verify your email" banner disappears.
    try {
      useAuthUser().value = await $fetch('/api/auth/me')
    } catch {
      /* not signed in — fine */
    }
  } catch (e) {
    state.value = 'error'
    message.value = apiError(e)
  }
})
</script>

<template>
  <div>
    <template v-if="state === 'verifying'">
      <h1>Verifying your email</h1>
      <p class="sub">One moment…</p>
    </template>

    <template v-else-if="state === 'done'">
      <h1>Email verified</h1>
      <p class="sub">Thanks — your account is confirmed. Overdue reminders and receipts can now reach you.</p>
      <NuxtLink to="/" class="btn btn-primary auth-submit">Go to dashboard</NuxtLink>
    </template>

    <template v-else>
      <h1>Link not valid</h1>
      <p class="sub">{{ message }}</p>
      <NuxtLink to="/login" class="btn auth-submit">Back to sign in</NuxtLink>
    </template>
  </div>
</template>
