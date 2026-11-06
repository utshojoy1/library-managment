<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const form = reactive({ email: '', password: '' })
const error = ref('')
const busy = ref(false)

const notice = computed(() =>
  route.query.reset
    ? 'Password updated. Sign in with your new password.'
    : route.query.verified
      ? 'Email verified — welcome aboard.'
      : '',
)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    const user = await $fetch('/api/auth/login', { method: 'POST', body: form })
    useAuthUser().value = user
    await navigateTo(String(route.query.redirect || '/'))
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <h1>Welcome back</h1>
    <p class="sub">Sign in to manage the collection.</p>

    <div v-if="notice" class="banner banner-ok">{{ notice }}</div>
    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <form @submit.prevent="submit">
      <div class="field">
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          class="input"
          type="email"
          name="email"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          required
          autofocus
        />
      </div>

      <div class="field" style="margin-top: 12px">
        <div class="label-row">
          <label class="label" for="password">Password</label>
          <NuxtLink to="/forgot-password" class="link-sm">Forgot password?</NuxtLink>
        </div>
        <input
          id="password"
          v-model="form.password"
          class="input"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary auth-submit" :disabled="busy">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="auth-switch">
      New here?
      <NuxtLink to="/register">Create an account</NuxtLink>
    </p>
  </div>
</template>
