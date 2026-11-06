<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = computed(() => String(route.query.token ?? ''))
const form = reactive({ password: '', confirm: '' })
const busy = ref(false)
const error = ref('')
const done = ref(false)

async function submit() {
  error.value = ''
  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match'
    return
  }
  busy.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: form.password },
    })
    done.value = true
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <template v-if="done">
      <h1>Password updated</h1>
      <p class="sub">Your password has been changed and all other sessions were signed out.</p>
      <NuxtLink to="/login?reset=1" class="btn btn-primary auth-submit">Sign in</NuxtLink>
    </template>

    <template v-else-if="!token">
      <h1>Invalid link</h1>
      <p class="sub">This password reset link is missing its token.</p>
      <NuxtLink to="/forgot-password" class="btn auth-submit">Request a new link</NuxtLink>
    </template>

    <template v-else>
      <h1>Choose a new password</h1>
      <p class="sub">Pick something at least 8 characters long.</p>

      <div v-if="error" class="banner banner-error">{{ error }}</div>

      <form @submit.prevent="submit">
        <div class="field">
          <label class="label" for="password">New password</label>
          <input id="password" v-model="form.password" class="input" type="password" autocomplete="new-password" minlength="8" required autofocus />
        </div>

        <div class="field" style="margin-top: 12px">
          <label class="label" for="confirm">Confirm password</label>
          <input id="confirm" v-model="form.confirm" class="input" type="password" autocomplete="new-password" required />
        </div>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="busy">
          {{ busy ? 'Updating…' : 'Update password' }}
        </button>
      </form>
    </template>

    <p class="auth-switch">
      <NuxtLink to="/login">Back to sign in</NuxtLink>
    </p>
  </div>
</template>
