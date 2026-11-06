<script setup lang="ts">
definePageMeta({ roles: ['admin', 'super_admin'] })
const { data: members, refresh } = await useFetch('/api/members')

const showForm = ref(false)
const busy = ref(false)
const error = ref('')

const form = reactive({ name: '', email: '', phone: '' })

async function addMember() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/members', { method: 'POST', body: form })
    await refresh()
    showForm.value = false
    Object.assign(form, { name: '', email: '', phone: '' })
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Members</h1>
        <p>{{ members?.length ?? 0 }} registered borrowers.</p>
      </div>
      <button class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : 'Add member' }}
      </button>
    </header>

    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <section v-if="showForm" class="card" style="margin-bottom: 18px">
      <div class="card-head"><h2>New member</h2></div>
      <div class="card-body">
        <form class="form-grid" @submit.prevent="addMember">
          <div class="field full">
            <label class="label" for="name">Full name *</label>
            <input id="name" v-model="form.name" class="input" required />
          </div>
          <div class="field">
            <label class="label" for="email">Email</label>
            <input id="email" v-model="form.email" class="input" type="email" />
          </div>
          <div class="field">
            <label class="label" for="phone">Phone</label>
            <input id="phone" v-model="form.phone" class="input" />
          </div>
          <p class="full" style="margin: 0; color: var(--muted); font-size: 12.5px">
            A membership number is generated automatically (e.g. M004).
          </p>
          <div class="actions full">
            <button type="button" class="btn" @click="showForm = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="busy">
              {{ busy ? 'Saving…' : 'Save member' }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="card">
      <div v-if="!members?.length" class="empty">No members yet — add the first one.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Number</th>
            <th>Contact</th>
            <th>Joined</th>
            <th>On loan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td><strong>{{ member.name }}</strong></td>
            <td class="mono">{{ member.memberNo }}</td>
            <td>
              {{ member.email || '—' }}
              <div class="mono">{{ member.phone }}</div>
            </td>
            <td>{{ formatDate(member.joinedAt) }}</td>
            <td>
              <span class="chip" :class="member.activeLoans >= 5 ? 'chip-red' : 'chip-gray'">
                {{ member.activeLoans }} / 5
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
