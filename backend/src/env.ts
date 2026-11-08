// Imported first by main.ts so .env is loaded before the database pool reads it.
// Variables already set in the real environment win.
try {
  process.loadEnvFile()
} catch {
  // No .env file — fine in production.
}
