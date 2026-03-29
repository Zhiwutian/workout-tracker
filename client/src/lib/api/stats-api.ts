/** Dashboard and analytics endpoints (e.g. weekly volume). */
import { fetchJson } from '@/lib/api-client';
import type { WeeklyVolumeResponse } from '@/lib/api/types';

export async function readWeeklyVolume(
  weekStart: string,
  timezone?: string | null,
): Promise<WeeklyVolumeResponse> {
  const q = new URLSearchParams({ weekStart });
  const tz = timezone?.trim();
  if (tz && tz !== 'UTC' && tz !== 'Etc/UTC') {
    q.set('timezone', tz);
  }
  return fetchJson<WeeklyVolumeResponse>(
    `/api/stats/weekly-volume?${q.toString()}`,
  );
}
