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
