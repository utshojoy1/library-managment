<script setup lang="ts">
const dev = import.meta.dev
</script>

<template>
  <div class="auth-shell">
    <div class="auth-panel">
      <div class="auth-brand">
        <span class="brand-mark">L</span>
        <div>
          <strong>Libraria</strong>
          <small>Library manager</small>
        </div>
      </div>

      <div class="auth-card">
        <slot />
      </div>

      <p class="auth-foot">
        Catalog · Members · Circulation
        <template v-if="dev">
          ·
          <NuxtLink to="/dev/mail" class="link-sm">Dev inbox</NuxtLink>
        </template>
      </p>
    </div>
  </div>
</template>
