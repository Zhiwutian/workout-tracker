import { DateTime } from 'luxon';

/** Monday 00:00 UTC for the week containing `d`, as `YYYY-MM-DD`. */
export function utcWeekStartISO(d: Date = new Date()): string {
  const day = d.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() - daysFromMonday,
    ),
  );
  return monday.toISOString().slice(0, 10);
}

/**
 * ISO Monday (calendar date) of the week containing `now` in `ianaZone`.
 * Falls back to {@link utcWeekStartISO} if the zone is invalid.
 */
export function mondayWeekStartISOInZone(
  ianaZone: string,
  now: DateTime = DateTime.now(),
): string {
  const z = now.setZone(ianaZone);
  if (!z.isValid) {
    return utcWeekStartISO(now.toUTC().toJSDate());
  }
  const monday = z.minus({ days: z.weekday - 1 }).startOf('day');
  return monday.toFormat('yyyy-MM-dd');
}
