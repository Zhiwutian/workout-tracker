/**
 * Monday-based week anchors in an IANA zone (aligned with client `lib/week.ts` + stats volume windows).
 */
import { DateTime, Info } from 'luxon';

/** `YYYY-MM-DD` for Monday 00:00 local in `ianaZone` containing `ref`. */
export function mondayWeekStartYmdInZone(
  ianaZone: string,
  ref: DateTime = DateTime.now(),
): string {
  const trimmed = ianaZone?.trim();
  if (!trimmed || trimmed === 'UTC' || trimmed === 'Etc/UTC') {
    const u = ref.toUTC();
    const monday = u.minus({ days: u.weekday - 1 }).startOf('day');
    return monday.toFormat('yyyy-MM-dd');
  }
  if (!Info.isValidIANAZone(trimmed)) {
    return mondayWeekStartYmdInZone('UTC', ref);
  }
  const z = ref.setZone(trimmed);
  const monday = z.minus({ days: z.weekday - 1 }).startOf('day');
  return monday.toFormat('yyyy-MM-dd');
}

/** Oldest → newest Monday `YYYY-MM-DD` for the last `n` weeks ending at the current week. */
export function lastNMondayWeekStarts(n: number, ianaZone: string): string[] {
  const current = mondayWeekStartYmdInZone(ianaZone);
  const zone =
    !ianaZone?.trim() ||
    ianaZone.trim() === 'UTC' ||
    ianaZone.trim() === 'Etc/UTC'
      ? 'UTC'
      : Info.isValidIANAZone(ianaZone.trim())
        ? ianaZone.trim()
        : 'UTC';
  let w = DateTime.fromFormat(current, 'yyyy-MM-dd', { zone }).startOf('day');
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(w.toFormat('yyyy-MM-dd'));
    w = w.minus({ weeks: 1 });
  }
  return out.reverse();
}
