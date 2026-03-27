import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { ClientError } from '@server/lib/client-error.js';
import { resolveWeeklyVolumeWindow } from './stats-service.js';

describe('resolveWeeklyVolumeWindow', () => {
  it('uses UTC when timezone omitted', () => {
    const { startUtc, endUtc, zoneUsed } = resolveWeeklyVolumeWindow(
      '2026-03-10',
      undefined,
    );
    expect(zoneUsed).toBe('utc');
    expect(startUtc.toISOString()).toBe('2026-03-10T00:00:00.000Z');
    expect(endUtc.toISOString()).toBe('2026-03-17T00:00:00.000Z');
  });

  it('uses UTC when timezone is UTC or Etc/UTC', () => {
    expect(resolveWeeklyVolumeWindow('2026-03-10', 'UTC').zoneUsed).toBe('utc');
    expect(resolveWeeklyVolumeWindow('2026-03-10', ' Etc/UTC ').zoneUsed).toBe(
      'utc',
    );
  });

  it('interprets weekStart as local start-of-day in IANA zone', () => {
    const { startUtc, endUtc, zoneUsed } = resolveWeeklyVolumeWindow(
      '2026-03-09',
      'America/New_York',
    );
    expect(zoneUsed).toBe('America/New_York');
    const expectedStart = DateTime.fromFormat('2026-03-09', 'yyyy-MM-dd', {
      zone: 'America/New_York',
    })
      .startOf('day')
      .toUTC();
    expect(startUtc.getTime()).toBe(expectedStart.toMillis());
    expect(endUtc.getTime()).toBe(expectedStart.plus({ weeks: 1 }).toMillis());
  });

  it('throws ClientError for invalid IANA zone', () => {
    expect(() => resolveWeeklyVolumeWindow('2026-03-09', 'Not/AZone')).toThrow(
      ClientError,
    );
  });
});
