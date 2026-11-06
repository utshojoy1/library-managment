export default defineEventHandler((event) => {
  return requireUser(event)
})
