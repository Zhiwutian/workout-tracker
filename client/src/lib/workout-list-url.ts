import type { RangePreset } from '@/lib/date-range-presets';

/** Aligned with `readWorkouts` query params. */
export type WorkoutStatusFilter = 'all' | 'active' | 'completed';
export type WorkoutSortFilter = 'startedAt_desc' | 'startedAt_asc';

const RANGE_VALUES = new Set<string>(['all', 'week', 'month']);
const STATUS_VALUES = new Set<string>(['all', 'active', 'completed']);

/** URL uses `newest` / `oldest`; API uses `startedAt_desc` / `startedAt_asc`. */
export function sortFromUrlParam(value: string | null): WorkoutSortFilter {
  if (value === 'oldest' || value === 'startedAt_asc') {
    return 'startedAt_asc';
  }
  if (
    value === 'newest' ||
    value === 'startedAt_desc' ||
    value === null ||
    value === ''
  ) {
    return 'startedAt_desc';
  }
  return 'startedAt_desc';
}

export function sortToUrlParam(sort: WorkoutSortFilter): string {
  return sort === 'startedAt_asc' ? 'oldest' : 'newest';
}

export function parseRangePreset(value: string | null): RangePreset {
  if (value && RANGE_VALUES.has(value)) {
    return value as RangePreset;
  }
  return 'all';
}

export function parseStatusFilter(value: string | null): WorkoutStatusFilter {
  if (value && STATUS_VALUES.has(value)) {
    return value as WorkoutStatusFilter;
  }
  return 'all';
}

export function buildWorkoutListSearchParams(
  range: RangePreset,
  status: WorkoutStatusFilter,
  sort: WorkoutSortFilter,
): URLSearchParams {
  const p = new URLSearchParams();
  if (range !== 'all') p.set('range', range);
  if (status !== 'all') p.set('status', status);
  const sortParam = sortToUrlParam(sort);
  if (sortParam !== 'newest') p.set('sort', sortParam);
  return p;
}

export function filtersAreDefault(
  range: RangePreset,
  status: WorkoutStatusFilter,
  sort: WorkoutSortFilter,
): boolean {
  return range === 'all' && status === 'all' && sort === 'startedAt_desc';
}
