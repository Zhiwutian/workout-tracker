/**
 * Local calendar ranges for workout list filters (slice 1).
 * Slice 3 may align stats with profile timezone — these use the browser's local TZ.
 */

/** Monday 00:00:00 local for the week containing `d`. */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

/** End of Sunday 23:59:59.999 local for the week containing `d`. */
export function endOfWeekSunday(d: Date): Date {
  const start = startOfWeekMonday(d);
  const x = new Date(start);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export type RangePreset = 'all' | 'week' | 'month';

export function rangePresetToIsoRange(
  preset: RangePreset,
  now = new Date(),
): { from?: string; to?: string } {
  if (preset === 'all') return {};
  if (preset === 'week') {
    return {
      from: startOfWeekMonday(now).toISOString(),
      to: endOfWeekSunday(now).toISOString(),
    };
  }
  return {
    from: startOfMonthLocal(now).toISOString(),
    to: endOfMonthLocal(now).toISOString(),
  };
}
