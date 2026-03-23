/**
 * Training volume for one set: reps × weight (multiplication, not a tuple type).
 * Aggregated dashboard totals sum this value across sets in a time window.
 */
export function setVolume(reps: number, weight: number): number {
  return reps * weight;
}
