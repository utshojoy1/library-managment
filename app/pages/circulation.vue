<script setup lang="ts">
import { normalizeCode } from '#shared/utils/codes'

definePageMeta({ roles: ['admin', 'super_admin'] })
const { data: loans, refresh } = await useFetch('/api/loans', { query: { limit: 10 } })

const checkout = reactive({ memberNo: '', barcode: '' })
const returnForm = reactive({ barcode: '' })

const busyOut = ref(false)
const busyIn = ref(false)
const errorOut = ref('')
const errorIn = ref('')
const okOut = ref('')
const okIn = ref('')

const barcodeInput = ref<HTMLInputElement>()

// Covers values that arrive without keystrokes: browser autofill, paste,
// and scanners that drop the whole code in at once.
function tidyCodes() {
  checkout.memberNo = normalizeCode(checkout.memberNo)
  checkout.barcode = normalizeCode(checkout.barcode)
  returnForm.barcode = normalizeCode(returnForm.barcode)
}

onMounted(() => barcodeInput.value?.focus())

async function issue() {
  busyOut.value = true
  errorOut.value = ''
  okOut.value = ''
  checkout.memberNo = normalizeCode(checkout.memberNo)
  checkout.barcode = normalizeCode(checkout.barcode)
  try {
    const res = await $fetch('/api/loans/checkout', { method: 'POST', body: checkout })
    okOut.value = `Issued “${res.bookTitle}” to ${res.memberName} — due ${formatDate(res.dueAt)}.`
    checkout.barcode = ''
    await refresh()
    barcodeInput.value?.focus()
  } catch (e) {
    errorOut.value = apiError(e)
  } finally {
    busyOut.value = false
  }
}

async function giveBack() {
  busyIn.value = true
  errorIn.value = ''
  okIn.value = ''
  returnForm.barcode = normalizeCode(returnForm.barcode)
  try {
    const res = await $fetch('/api/loans/return', { method: 'POST', body: returnForm })
    okIn.value = res.daysLate
      ? `Returned “${res.bookTitle}” — ${res.daysLate} day(s) late.`
      : `Returned “${res.bookTitle}” on time.`
    returnForm.barcode = ''
    await refresh()
  } catch (e) {
    errorIn.value = apiError(e)
  } finally {
    busyIn.value = false
  }
}
</script>

<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Circulation</h1>
        <p>Scan or type a barcode to issue or return a copy.</p>
      </div>
    </header>

    <div class="split">
      <section class="card">
        <div class="card-head"><h2>Check out</h2></div>
        <div class="card-body">
          <div v-if="errorOut" class="banner banner-error">{{ errorOut }}</div>
          <div v-if="okOut" class="banner banner-ok">{{ okOut }}</div>

          <form @submit.prevent="issue">
            <div class="field" style="margin-bottom: 10px">
              <label class="label" for="memberNo">Member number</label>
              <input
                id="memberNo"
                v-model="checkout.memberNo"
                class="input code-input"
                placeholder="M001"
                @input="checkout.memberNo = normalizeCode(checkout.memberNo)"
                @change="tidyCodes"
                required
              />
            </div>
            <div class="field">
              <label class="label" for="outBarcode">Copy barcode</label>
              <input
                id="outBarcode"
                ref="barcodeInput"
                v-model="checkout.barcode"
                class="input code-input"
                placeholder="B0001-1"
                @input="checkout.barcode = normalizeCode(checkout.barcode)"
                @change="tidyCodes"
                required
              />
            </div>
            <div class="actions">
              <button type="submit" class="btn btn-primary" :disabled="busyOut">
                {{ busyOut ? 'Issuing…' : 'Issue book' }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Return</h2></div>
        <div class="card-body">
          <div v-if="errorIn" class="banner banner-error">{{ errorIn }}</div>
          <div v-if="okIn" class="banner banner-ok">{{ okIn }}</div>

          <form @submit.prevent="giveBack">
            <div class="field">
              <label class="label" for="inBarcode">Copy barcode</label>
              <input
                id="inBarcode"
                v-model="returnForm.barcode"
                class="input code-input"
                placeholder="B0001-1"
                @input="returnForm.barcode = normalizeCode(returnForm.barcode)"
                @change="tidyCodes"
                required
              />
            </div>
            <div class="actions">
              <button type="submit" class="btn" :disabled="busyIn">
                {{ busyIn ? 'Returning…' : 'Return book' }}
              </button>
            </div>
          </form>
          <p class="hint">Closes the active loan and puts the copy back into circulation.</p>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-head"><h2>Recent activity</h2></div>
      <div v-if="!loans?.length" class="empty">No loans recorded yet.</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Book</th>
            <th>Member</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Returned</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in loans" :key="loan.id">
            <td><strong>{{ loan.bookTitle }}</strong></td>
            <td>{{ loan.memberName }}</td>
            <td>{{ formatDate(loan.issuedAt) }}</td>
            <td>{{ formatDate(loan.dueAt) }}</td>
            <td>
              <span v-if="loan.status === 'returned'" class="chip chip-gray">
                {{ formatDate(loan.returnedAt) }}
              </span>
              <span v-else-if="daysUntil(loan.dueAt) < 0" class="chip chip-red">Overdue</span>
              <span v-else class="chip chip-green">On loan</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
