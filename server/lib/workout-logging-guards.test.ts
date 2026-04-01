import { describe, expect, it } from 'vitest';
import { ClientError } from '@server/lib/client-error.js';
import { assertWorkoutAcceptsNewSets } from './workout-logging-guards.js';

describe('assertWorkoutAcceptsNewSets', () => {
  it('does not throw when endedAt is null', () => {
    expect(() => assertWorkoutAcceptsNewSets(null)).not.toThrow();
  });

  it('throws when endedAt is set', () => {
    expect(() =>
      assertWorkoutAcceptsNewSets(new Date('2026-01-01T12:00:00.000Z')),
    ).toThrow(ClientError);
  });
});
