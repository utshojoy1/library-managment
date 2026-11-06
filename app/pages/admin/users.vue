<script setup lang="ts">
definePageMeta({ roles: ['super_admin'] })

const { user: me } = useAuth()
const { data: users, refresh } = await useFetch('/api/admin/users')

const error = ref('')
const saving = ref<number | null>(null)

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

async function update(id: number, patch: Record<string, unknown>) {
  saving.value = id
  error.value = ''
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: patch })
    await refresh()
  } catch (e) {
    error.value = apiError(e)
    await refresh()
  } finally {
    saving.value = null
  }
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Users &amp; access</h1>
        <p>Promote staff, demote accounts, or disable access. Super admins only.</p>
      </div>
    </header>

    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <section class="card">
      <table class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <strong>{{ u.name }}</strong>
              <span v-if="u.id === me?.id" class="chip chip-indigo" style="margin-left: 6px">you</span>
              <div class="mono">{{ u.email }}</div>
            </td>
            <td>
              <select
                v-model="u.role"
                class="input input-sm"
                :disabled="u.id === me?.id || saving === u.id"
                @change="update(u.id, { role: u.role })"
              >
                <option v-for="option in ROLE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </td>
            <td>
              <span class="chip" :class="u.isActive ? 'chip-green' : 'chip-gray'">
                {{ u.isActive ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td style="text-align: right">
              <button
                class="btn btn-sm"
                :disabled="u.id === me?.id || saving === u.id"
                @click="update(u.id, { isActive: !u.isActive })"
              >
                {{ u.isActive ? 'Disable' : 'Enable' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <p class="hint">
      Admins can manage the catalog, members and circulation. Members can browse the catalog and see their own
      loans. You cannot change your own role or disable your own account.
    </p>
  </div>
</template>
