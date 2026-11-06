<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match'
    return
  }
  busy.value = true
  try {
    const user = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: form.name, email: form.email, password: form.password },
    })
    useAuthUser().value = user
    await navigateTo('/')
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <h1>Create an account</h1>
    <p class="sub">Membership accounts can browse the catalog and track their loans.</p>

    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <form @submit.prevent="submit">
      <div class="field">
        <label class="label" for="name">Full name</label>
        <input id="name" v-model="form.name" class="input" name="name" autocomplete="name" required autofocus />
      </div>

      <div class="field" style="margin-top: 12px">
        <label class="label" for="email">Email</label>
        <input id="email" v-model="form.email" class="input" type="email" name="email" autocomplete="email" autocapitalize="none" spellcheck="false" required />
      </div>

      <div class="field" style="margin-top: 12px">
        <label class="label" for="password">Password</label>
        <input id="password" v-model="form.password" class="input" type="password" name="password" autocomplete="new-password" minlength="8" required />
        <small class="field-hint">At least 8 characters.</small>
      </div>

      <div class="field" style="margin-top: 12px">
        <label class="label" for="confirm">Confirm password</label>
        <input id="confirm" v-model="form.confirm" class="input" type="password" name="confirmPassword" autocomplete="new-password" required />
      </div>

      <button type="submit" class="btn btn-primary auth-submit" :disabled="busy">
        {{ busy ? 'Creating…' : 'Create account' }}
      </button>
    </form>

    <p class="auth-switch">
      Already registered?
      <NuxtLink to="/login">Sign in</NuxtLink>
    </p>
  </div>
</template>
