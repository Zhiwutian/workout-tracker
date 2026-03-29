import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
  lastNMondayWeekStarts,
  mondayWeekStartYmdInZone,
} from './week-helpers.js';

describe('mondayWeekStartYmdInZone', () => {
  it('returns Monday for a Wednesday in UTC', () => {
    expect(
      mondayWeekStartYmdInZone(
        'UTC',
        DateTime.fromISO('2026-03-25T12:00:00.000Z'),
      ),
    ).toBe('2026-03-23');
  });

  it('falls back to UTC Monday when IANA zone is invalid', () => {
    expect(
      mondayWeekStartYmdInZone(
        'Not/AZone',
        DateTime.fromISO('2026-03-25T12:00:00.000Z'),
      ),
    ).toBe('2026-03-23');
  });

  it('uses America/New_York local Monday', () => {
    const monday = mondayWeekStartYmdInZone(
      'America/New_York',
      DateTime.fromISO('2026-03-25T12:00:00.000Z'),
    );
    expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dt = DateTime.fromFormat(monday, 'yyyy-MM-dd', {
      zone: 'America/New_York',
    });
    expect(dt.weekday).toBe(1);
  });
});

describe('lastNMondayWeekStarts', () => {
  it('returns n ISO dates spaced by 7 days, oldest first', () => {
    const n = 5;
    const arr = lastNMondayWeekStarts(n, 'UTC');
    expect(arr).toHaveLength(n);
    for (let i = 1; i < arr.length; i++) {
      const a = DateTime.fromFormat(arr[i - 1], 'yyyy-MM-dd', { zone: 'utc' });
      const b = DateTime.fromFormat(arr[i], 'yyyy-MM-dd', { zone: 'utc' });
      expect(b.diff(a, 'days').days).toBe(7);
    }
    const sorted = [...arr].sort();
    expect(arr).toEqual(sorted);
  });

  it('returns empty array when n is 0', () => {
    expect(lastNMondayWeekStarts(0, 'UTC')).toEqual([]);
  });
});
