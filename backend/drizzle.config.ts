import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile()
} catch {
  // No .env file: use the real environment or the default below.
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://library:library@127.0.0.1:5434/library',
  },
})
