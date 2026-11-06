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

      <p class="auth-foot">Catalog · Members · Circulation</p>
    </div>
  </div>
</template>
