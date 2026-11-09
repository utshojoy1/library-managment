import { Transform } from 'class-transformer'

// DTO field transforms, applied by the global ValidationPipe before validation runs.

const mapString = (fn: (s: string) => string) =>
  Transform(({ value }) => (typeof value === 'string' ? fn(value) : value))

export const Trim = () => mapString((s) => s.trim())
export const ToLowerCase = () => mapString((s) => s.trim().toLowerCase())

/**
 * Barcodes and member numbers are stored uppercase (`B0002-1`, `M001`), so a
 * scanned or hand-typed lowercase value still finds the right record.
 */
export const ToUpperCase = () => mapString((s) => s.trim().toUpperCase())

/** HTML number inputs send strings; an empty one means "not given". */
export const ToOptionalNumber = () =>
  Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
