import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { mondayWeekStartISOInZone, utcWeekStartISO } from './week';

describe('mondayWeekStartISOInZone', () => {
  it('returns ISO Monday for the week containing now in the zone', () => {
    const fixed = DateTime.fromISO('2026-03-11T12:00:00', {
      zone: 'America/New_York',
    });
    expect(mondayWeekStartISOInZone('America/New_York', fixed)).toBe(
      '2026-03-09',
    );
  });

  it('falls back to UTC Monday when zone is invalid', () => {
    const fixed = DateTime.fromISO('2026-03-11T12:00:00Z');
    expect(mondayWeekStartISOInZone('Invalid/Zone', fixed)).toBe(
      utcWeekStartISO(fixed.toUTC().toJSDate()),
    );
  });
});
