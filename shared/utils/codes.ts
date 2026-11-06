/**
 * Barcodes and member numbers are stored uppercase (`B0002-1`, `M001`).
 * Normalising every entry point means a scanned or hand-typed lowercase value
 * still finds the right record.
 */
export function normalizeCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}
