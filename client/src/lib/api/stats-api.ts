/** Dashboard and analytics endpoints (e.g. weekly volume). */
import { fetchJson } from '@/lib/api-client';
import type {
  StatsSummaryResponse,
  VolumeSeriesResponse,
  WeeklyVolumeResponse,
} from '@/lib/api/types';

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

export async function readVolumeSeries(
  weeks: number,
  timezone?: string | null,
): Promise<VolumeSeriesResponse> {
  const q = new URLSearchParams({ weeks: String(weeks) });
  const tz = timezone?.trim();
  if (tz && tz !== 'UTC' && tz !== 'Etc/UTC') {
    q.set('timezone', tz);
  }
  return fetchJson<VolumeSeriesResponse>(
    `/api/stats/volume-series?${q.toString()}`,
  );
}

export async function readStatsSummary(
  timezone?: string | null,
): Promise<StatsSummaryResponse> {
  const q = new URLSearchParams();
  const tz = timezone?.trim();
  if (tz && tz !== 'UTC' && tz !== 'Etc/UTC') {
    q.set('timezone', tz);
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return fetchJson<StatsSummaryResponse>(`/api/stats/summary${suffix}`);
}
