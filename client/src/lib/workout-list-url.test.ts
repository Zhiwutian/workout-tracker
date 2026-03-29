import { describe, expect, it } from 'vitest';
import {
  buildWorkoutListSearchParams,
  filtersAreDefault,
  parseRangePreset,
  parseStatusFilter,
  sortFromUrlParam,
  sortToUrlParam,
} from './workout-list-url';

describe('workout-list-url', () => {
  it('parses range, status, sort from URL', () => {
    expect(parseRangePreset('month')).toBe('month');
    expect(parseRangePreset('invalid')).toBe('all');
    expect(parseStatusFilter('active')).toBe('active');
    expect(sortFromUrlParam('oldest')).toBe('startedAt_asc');
    expect(sortFromUrlParam('newest')).toBe('startedAt_desc');
    expect(sortFromUrlParam(null)).toBe('startedAt_desc');
  });

  it('builds minimal search params', () => {
    expect(
      buildWorkoutListSearchParams('all', 'all', 'startedAt_desc').toString(),
    ).toBe('');
    const p = buildWorkoutListSearchParams(
      'month',
      'completed',
      'startedAt_asc',
    );
    expect(p.get('range')).toBe('month');
    expect(p.get('status')).toBe('completed');
    expect(p.get('sort')).toBe('oldest');
  });

  it('sortToUrlParam round-trips with sortFromUrlParam', () => {
    const sorts = ['startedAt_desc', 'startedAt_asc'] as const;
    for (const s of sorts) {
      expect(sortFromUrlParam(sortToUrlParam(s))).toBe(s);
    }
  });

  it('filtersAreDefault', () => {
    expect(filtersAreDefault('all', 'all', 'startedAt_desc')).toBe(true);
    expect(filtersAreDefault('week', 'all', 'startedAt_desc')).toBe(false);
  });
});
