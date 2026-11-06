<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const form = reactive({ email: '', password: '' })
const error = ref('')
const busy = ref(false)

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

    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <form @submit.prevent="submit">
      <div class="field">
        <label class="label" for="email">Email</label>
        <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" required autofocus />
      </div>

      <div class="field" style="margin-top: 12px">
        <label class="label" for="password">Password</label>
        <input id="password" v-model="form.password" class="input" type="password" autocomplete="current-password" required />
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
