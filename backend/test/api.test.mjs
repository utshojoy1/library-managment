// Runs against a live API with freshly seeded data:
//   npm run db:seed && npm run dev   (then, in another terminal)   npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import pg from 'pg'

const API = process.env.API_URL ?? 'http://localhost:4000/api'

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => null), cookie: res.headers.get('set-cookie')?.split(';')[0] }
}

async function login(email, password) {
  const res = await call('/auth/login', { method: 'POST', body: { email, password } })
  assert.equal(res.status, 200, `login ${email}`)
  return res.cookie
}

test('routes are closed by default and narrowed by role', async () => {
  assert.equal((await call('/stats')).status, 401)
  const member = await login('member@library.local', 'Member12345')
  assert.equal((await call('/members', { cookie: member })).status, 403)
  assert.equal((await call('/loans/mine', { cookie: member })).status, 200)
  const admin = await login('admin@library.local', 'Admin12345')
  assert.equal((await call('/members', { cookie: admin })).status, 200)
  assert.equal((await call('/admin/users', { cookie: admin })).status, 403)
})

test('a reset link works once, even when redeemed twice at the same moment', async () => {
  const email = `reset-${Date.now()}@example.com`
  await call('/auth/register', { method: 'POST', body: { name: 'Reset Test', email, password: 'Original123' } })
  assert.equal((await call('/auth/forgot-password', { method: 'POST', body: { email } })).status, 200)

  const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const { rows } = await db.query(`select text from emails where "to" = $1 and subject like 'Reset%' order by id desc limit 1`, [email])
  await db.end()
  const token = rows[0].text.match(/token=([\w-]+)/)[1]

  const results = await Promise.all(
    ['First1234', 'Second1234'].map((password) => call('/auth/reset-password', { method: 'POST', body: { token, password } })),
  )
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400])
})

test('checkout enforces the 5-loan limit and return frees the copy', async () => {
  const admin = await login('admin@library.local', 'Admin12345')
  const member = await call('/members', { method: 'POST', cookie: admin, body: { name: 'Limit Test' } })
  const memberNo = member.data.memberNo

  const books = (await call('/books', { cookie: admin })).data
  const free = books.flatMap((b) => b.copies).filter((c) => c.status === 'available').map((c) => c.barcode)
  assert.ok(free.length >= 6, 'seed has at least 6 free copies')

  // Six desks at once: the member lock must let exactly five through.
  const results = await Promise.all(
    free.slice(0, 6).map((barcode) => call('/loans/checkout', { method: 'POST', cookie: admin, body: { memberNo, barcode } })),
  )
  const issued = free.slice(0, 6).filter((_, i) => results[i].status === 201)
  assert.equal(issued.length, 5)
  assert.equal(results.filter((r) => r.status === 409).length, 1)

  for (const barcode of issued) {
    assert.equal((await call('/loans/return', { method: 'POST', cookie: admin, body: { barcode: barcode.toLowerCase() } })).status, 201)
  }
})
