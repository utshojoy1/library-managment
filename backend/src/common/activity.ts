import type { EntityManager } from 'typeorm'
import { ActivityLog, type ActivityAction } from '../entities/activity-log.entity.js'
import type { SessionUser } from './roles.js'

export type Actor = Pick<SessionUser, 'id' | 'name'> | null

/** Records one event. Pass the caller's transaction manager so the log and the change commit together. */
export function logActivity(
  manager: EntityManager,
  actor: Actor,
  entry: { action: ActivityAction; subject: string; detail?: string | null; bookId?: number | null; memberId?: number | null },
) {
  return manager.insert(ActivityLog, {
    action: entry.action,
    subject: entry.subject,
    detail: entry.detail ?? null,
    bookId: entry.bookId ?? null,
    memberId: entry.memberId ?? null,
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? null,
  })
}
