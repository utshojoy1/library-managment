import { daysUntil } from '@/lib/format'
import type { Loan } from '@/lib/types'

export function LoanStatus({ loan }: { loan: Pick<Loan, 'status' | 'dueAt'> }) {
  if (loan.status === 'returned') return <span className="chip chip-gray">Returned</span>
  // Overdue as soon as the due time passes; daysUntil rounds a few hours late up to 0.
  if (new Date(loan.dueAt).getTime() < Date.now()) return <span className="chip chip-red">Overdue</span>
  const days = daysUntil(loan.dueAt)
  if (days <= 3) return <span className="chip chip-amber">Due in {days}d</span>
  return <span className="chip chip-green">On time</span>
}
