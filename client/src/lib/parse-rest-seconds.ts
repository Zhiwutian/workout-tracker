/** Shared parsing for “rest after set” inputs so the client matches server Zod limits. */
const MAX_REST_SECONDS = 86400;

/**
 * Parse optional “rest after set” field: empty / whitespace → `null`;
 * otherwise integer seconds clamped to **[0, 86400]** (matches API).
 */
export function parseRestSecondsInput(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = parseInt(t, 10);
  const v = Number.isFinite(n) ? n : 0;
  return Math.min(MAX_REST_SECONDS, Math.max(0, v));
}
