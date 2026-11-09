/** Postgres unique-violation, whether the ORM wraps the driver error or not. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; driverError?: { code?: string } }
  return (e?.code ?? e?.driverError?.code) === '23505'
}
