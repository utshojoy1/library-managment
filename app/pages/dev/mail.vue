<script setup lang="ts">
definePageMeta({ layout: false })

const { data: mails, refresh, error } = await useFetch('/api/dev/outbox')

function linksIn(text: string) {
  return Array.from(new Set(text.match(/https?:\/\/\S+/g) ?? []))
}

function when(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="mail-shell">
    <header class="mail-head">
      <div>
        <h1>Dev inbox</h1>
        <p>Messages captured by the outbox. No SMTP is configured, so nothing left this machine.</p>
      </div>
      <button class="btn btn-sm" @click="refresh()">Refresh</button>
    </header>

    <div v-if="error" class="banner banner-error">Could not load the outbox.</div>

    <div v-if="!mails?.length" class="card">
      <div class="empty">
        No messages yet — register an account or request a password reset to see one here.
      </div>
    </div>

    <article v-for="mail in mails" :key="mail.id" class="card mail-card">
      <div class="mail-top">
        <div>
          <strong>{{ mail.subject }}</strong>
          <div class="mono">to {{ mail.to }}</div>
        </div>
        <span class="chip chip-gray">{{ when(mail.createdAt) }}</span>
      </div>

      <div v-if="linksIn(mail.text).length" class="mail-links">
        <a v-for="link in linksIn(mail.text)" :key="link" :href="link" class="mail-link">{{ link }}</a>
      </div>
    </article>

    <p class="hint" style="text-align: center">
      Development only ·
      <NuxtLink to="/login" class="link-sm">Back to sign in</NuxtLink>
    </p>
  </div>
</template>
