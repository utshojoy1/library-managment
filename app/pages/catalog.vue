<script setup lang="ts">
const { isStaff } = useAuth()
const { data: books, refresh } = await useFetch('/api/books')

const search = ref('')
const showForm = ref(false)
const busy = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  author: '',
  isbn: '',
  category: '',
  publishedYear: undefined as number | undefined,
  copies: 1,
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return books.value ?? []
  return (books.value ?? []).filter((b) =>
    [b.title, b.author, b.isbn, b.category]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q)),
  )
})

async function addBook() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/books', { method: 'POST', body: form })
    await refresh()
    showForm.value = false
    Object.assign(form, { title: '', author: '', isbn: '', category: '', publishedYear: undefined, copies: 1 })
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
        <h1>Catalog</h1>
        <p>{{ books?.length ?? 0 }} titles in the collection.</p>
      </div>
      <button v-if="isStaff" class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : 'Add book' }}
      </button>
    </header>

    <div v-if="error" class="banner banner-error">{{ error }}</div>

    <section v-if="isStaff && showForm" class="card" style="margin-bottom: 18px">
      <div class="card-head"><h2>New title</h2></div>
      <div class="card-body">
        <form class="form-grid" @submit.prevent="addBook">
          <div class="field full">
            <label class="label" for="title">Title *</label>
            <input id="title" v-model="form.title" class="input" required />
          </div>
          <div class="field">
            <label class="label" for="author">Author *</label>
            <input id="author" v-model="form.author" class="input" required />
          </div>
          <div class="field">
            <label class="label" for="isbn">ISBN</label>
            <input id="isbn" v-model="form.isbn" class="input" />
          </div>
          <div class="field">
            <label class="label" for="category">Category</label>
            <input id="category" v-model="form.category" class="input" placeholder="Fiction, Science…" />
          </div>
          <div class="field">
            <label class="label" for="year">Published year</label>
            <input id="year" v-model.number="form.publishedYear" class="input" type="number" min="1000" max="2100" />
          </div>
          <div class="field">
            <label class="label" for="copies">Copies to add</label>
            <input id="copies" v-model.number="form.copies" class="input" type="number" min="1" max="50" />
          </div>
          <div class="actions full">
            <button type="button" class="btn" @click="showForm = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="busy">
              {{ busy ? 'Saving…' : 'Save book' }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <div class="toolbar">
      <input v-model="search" class="input" type="search" placeholder="Search by title, author, ISBN…" />
    </div>

    <div v-if="!filtered.length" class="card">
      <div class="empty">
        {{ books?.length ? 'No books match your search.' : 'The catalog is empty — add your first book.' }}
      </div>
    </div>

    <div v-else class="book-grid">
      <article v-for="book in filtered" :key="book.id" class="book-card">
        <span v-if="book.category" class="chip chip-indigo" style="align-self: flex-start">
          {{ book.category }}
        </span>
        <h3>{{ book.title }}</h3>
        <div class="author">{{ book.author }}</div>
        <div class="meta">
          <span class="mono">{{ book.isbn || 'No ISBN' }}</span>
          <span
            class="chip"
            :class="book.available > 0 ? 'chip-green' : 'chip-red'"
          >
            {{ book.available }} / {{ book.total }} available
          </span>
        </div>
      </article>
    </div>
  </div>
</template>
