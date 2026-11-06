export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token ?? '').trim()

  const userId = await consumeEmailToken(token, 'verify_email')
  await markEmailVerified(userId)

  return { ok: true }
})
