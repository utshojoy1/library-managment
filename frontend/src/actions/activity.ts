'use server'

import { getActivity } from '@/components/app-shell/activity-list'

/** Newest few log entries, for the live popup. Staff only — the API enforces it; null on failure. */
export async function latestActivity() {
  return getActivity(5)
}
