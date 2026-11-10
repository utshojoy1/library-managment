export type Slice = { label: string; value: number; color: string }

// r = 100/2π, so the circumference is 100 and dash lengths are plain percentages.
const R = 15.9155
const GAP = 0.6 // ≈2px of surface between slices at the rendered size

/** Part-to-whole donut. Server-rendered SVG; the legend carries the numbers, so color is never the only cue. */
export function DonutChart({ title, slices, unit }: { title: string; slices: Slice[]; unit: string }) {
  const shown = slices.filter((s) => s.value > 0)
  const total = shown.reduce((sum, s) => sum + s.value, 0)
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0)
  const gap = shown.length > 1 ? GAP : 0

  let offset = 0
  return (
    <section className="card chart-card">
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      <div className="chart-body">
        <svg viewBox="0 0 42 42" className="donut" role="img" aria-label={`${title}: ${total} ${unit}`}>
          <circle cx="21" cy="21" r={R} className="donut-track" />
          {shown.map((s) => {
            const len = (s.value / total) * 100
            const el = (
              <circle
                key={s.label}
                cx="21"
                cy="21"
                r={R}
                className="donut-slice"
                stroke={s.color}
                strokeDasharray={`${Math.max(len - gap, 0.01)} ${100 - len + gap}`}
                // Start at 12 o'clock and run clockwise.
                strokeDashoffset={25 - offset}
              >
                <title>{`${s.label}: ${s.value} (${pct(s.value)}%)`}</title>
              </circle>
            )
            offset += len
            return el
          })}
          <text x="21" y="20.5" className="donut-total">{total}</text>
          <text x="21" y="26" className="donut-unit">{unit}</text>
        </svg>

        <ul className="legend">
          {slices.map((s) => (
            <li key={s.label}>
              <span className="swatch" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{s.value}</span>
              <span className="legend-pct">{pct(s.value)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
