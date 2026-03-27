import { describe, expect, it } from 'vitest';
import {
  endOfMonthLocal,
  endOfWeekSunday,
  rangePresetToIsoRange,
  startOfMonthLocal,
  startOfWeekMonday,
} from './date-range-presets';

describe('date-range-presets', () => {
  it('startOfWeekMonday returns Monday 00:00 for a Wednesday', () => {
    const wed = new Date(2026, 2, 11, 15, 30, 0); // Mar 11 2026 Wed
    const mon = startOfWeekMonday(wed);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(9);
    expect(mon.getHours()).toBe(0);
  });

  it('rangePresetToIsoRange week contains start and end', () => {
    const now = new Date(2026, 2, 11, 12, 0, 0);
    const { from, to } = rangePresetToIsoRange('week', now);
    expect(from && to).toBeTruthy();
    expect(new Date(from!).getTime()).toBeLessThanOrEqual(
      new Date(to!).getTime(),
    );
  });

  it('rangePresetToIsoRange month spans full calendar month', () => {
    const now = new Date(2026, 2, 15);
    const { from, to } = rangePresetToIsoRange('month', now);
    expect(new Date(from!).getDate()).toBe(1);
    expect(new Date(to!).getMonth()).toBe(2);
  });

  it('startOfMonthLocal / endOfMonthLocal bracket March', () => {
    const d = new Date(2026, 2, 15);
    expect(startOfMonthLocal(d).getDate()).toBe(1);
    expect(endOfMonthLocal(d).getDate()).toBe(31);
  });

  it('endOfWeekSunday is after startOfWeekMonday same week', () => {
    const d = new Date(2026, 2, 11);
    const a = startOfWeekMonday(d);
    const b = endOfWeekSunday(d);
    expect(b.getTime()).toBeGreaterThan(a.getTime());
  });
});
