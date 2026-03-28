/**
 * Minimal RFC 4180-style CSV field escaping for export downloads.
 */
export function escapeCsvField(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
