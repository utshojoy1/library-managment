const pgCode = (error: unknown) => {
  const e = error as { code?: string; driverError?: { code?: string } }
  return e?.code ?? e?.driverError?.code
}

/** Postgres unique-violation, whether the ORM wraps the driver error or not. */
export const isUniqueViolation = (error: unknown) => pgCode(error) === '23505'

/** Postgres foreign-key violation: the row is still referenced elsewhere. */
export const isForeignKeyViolation = (error: unknown) => pgCode(error) === '23503'
