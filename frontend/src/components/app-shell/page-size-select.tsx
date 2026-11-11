'use client'

import { useRouter } from 'next/navigation'

/** "Show [80] per page". Changing it jumps back to page 1, since the old page number no longer lines up. */
export function PageSizeSelect({ size, options }: { size: number; options: number[] }) {
  const router = useRouter()
  return (
    <label className="page-size">
      Show
      <select className="input" value={size} onChange={(e) => router.push(`?size=${e.target.value}`)}>
        {options.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      per page
    </label>
  )
}
