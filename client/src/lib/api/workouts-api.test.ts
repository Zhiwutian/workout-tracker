import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchJson = vi.fn();
vi.mock('@/lib/api-client', () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args),
}));

import { patchWorkout } from '@/lib/api/workouts-api';

describe('workouts-api', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    fetchJson.mockResolvedValue({});
  });

  it('patchWorkout sends PATCH with endedAt to finish', async () => {
    await patchWorkout(12, { endedAt: '2026-03-01T12:00:00.000Z' });
    expect(fetchJson).toHaveBeenCalledWith('/api/workouts/12', {
      method: 'PATCH',
      body: JSON.stringify({ endedAt: '2026-03-01T12:00:00.000Z' }),
    });
  });

  it('patchWorkout sends null endedAt to resume', async () => {
    await patchWorkout(12, { endedAt: null });
    expect(fetchJson).toHaveBeenCalledWith('/api/workouts/12', {
      method: 'PATCH',
      body: JSON.stringify({ endedAt: null }),
    });
  });
});
