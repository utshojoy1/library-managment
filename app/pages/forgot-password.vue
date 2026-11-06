<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const sent = ref(false)
const busy = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    sent.value = true
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <template v-if="!sent">
      <h1>Reset your password</h1>
      <p class="sub">Enter your email and we'll send you a link to choose a new password.</p>

      <div v-if="error" class="banner banner-error">{{ error }}</div>

      <form @submit.prevent="submit">
        <div class="field">
          <label class="label" for="email">Email</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="email" required autofocus />
        </div>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="busy">
          {{ busy ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
    </template>

    <template v-else>
      <h1>Check your inbox</h1>
      <p class="sub">
        If an account exists for <strong>{{ email }}</strong>, a reset link is on its way. It expires in
        one hour.
      </p>
      <NuxtLink to="/login" class="btn auth-submit">Back to sign in</NuxtLink>
    </template>

    <p class="auth-switch">
      <NuxtLink to="/login">Back to sign in</NuxtLink>
    </p>
  </div>
</template>
