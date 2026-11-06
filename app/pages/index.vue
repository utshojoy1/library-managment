<script setup lang="ts">
const { user, isStaff } = useAuth()

const staff = isStaff.value

const { data: stats } = await useFetch('/api/stats', { immediate: staff })
const { data: loans } = await useFetch(staff ? '/api/loans' : '/api/loans/mine', {
  query: staff ? { status: 'active', limit: 8 } : {},
})

const summary = computed(
  () => stats.value ?? { books: 0, copies: 0, members: 0, activeLoans: 0, overdue: 0 },
)

const firstName = computed(() => user.value?.name?.split(' ')[0] ?? 'there')
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>{{ staff ? 'Dashboard' : `Welcome back, ${firstName}` }}</h1>
        <p v-if="staff">Today at a glance — catalog, members and what is out on loan.</p>
        <p v-else>Your library account, current loans and due dates.</p>
      </div>
      <NuxtLink v-if="staff" to="/circulation" class="btn btn-primary">Issue a book</NuxtLink>
      <NuxtLink v-else to="/catalog" class="btn btn-primary">Browse catalog</NuxtLink>
    </header>

    <section v-if="staff" class="stats">
      <div class="stat">
        <span>Book titles</span>
        <strong>{{ summary.books }}</strong>
      </div>
      <div class="stat">
        <span>Physical copies</span>
        <strong>{{ summary.copies }}</strong>
      </div>
      <div class="stat">
        <span>Members</span>
        <strong>{{ summary.members }}</strong>
      </div>
      <div class="stat">
        <span>On loan</span>
        <strong>{{ summary.activeLoans }}</strong>
        <small v-if="summary.overdue" class="stat-note">{{ summary.overdue }} overdue</small>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>{{ staff ? 'Active loans' : 'My loans' }}</h2>
        <span v-if="staff && summary.overdue" class="chip chip-red">{{ summary.overdue }} overdue</span>
      </div>

      <div v-if="!loans?.length" class="empty">
        {{ staff ? 'Nothing is out on loan right now.' : 'You have no loans yet — visit the catalog to find something.' }}
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Book</th>
            <th v-if="staff">Member</th>
            <th>Copy</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in loans" :key="loan.id">
            <td>
              <strong>{{ loan.bookTitle }}</strong>
              <div class="mono">{{ loan.author }}</div>
            </td>
            <td v-if="staff">
              {{ loan.memberName }}
              <div class="mono">{{ loan.memberNo }}</div>
            </td>
            <td class="mono">{{ loan.barcode }}</td>
            <td>{{ formatDate(loan.dueAt) }}</td>
            <td>
              <span v-if="loan.status === 'returned'" class="chip chip-gray">Returned</span>
              <span v-else-if="daysUntil(loan.dueAt) < 0" class="chip chip-red">
                Overdue {{ Math.abs(daysUntil(loan.dueAt)) }}d
              </span>
              <span v-else-if="daysUntil(loan.dueAt) <= 3" class="chip chip-amber">
                Due in {{ daysUntil(loan.dueAt) }}d
              </span>
              <span v-else class="chip chip-green">On time</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
