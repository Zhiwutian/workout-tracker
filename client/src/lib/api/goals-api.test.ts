import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchJson = vi.fn();
vi.mock('@/lib/api-client', () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args),
}));

import {
  createGoal,
  patchGoal,
  readGoals,
  removeGoal,
} from '@/lib/api/goals-api';

describe('goals-api', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    fetchJson.mockResolvedValue({});
  });

  it('readGoals GETs /api/goals', async () => {
    fetchJson.mockResolvedValue({ goals: [] });
    await readGoals();
    expect(fetchJson).toHaveBeenCalledWith('/api/goals');
  });

  it('createGoal POSTs JSON body', async () => {
    const body = {
      goalType: 'weekly_volume' as const,
      targetValue: 5000,
      workoutTypeFilter: 'cardio' as const,
    };
    await createGoal(body);
    expect(fetchJson).toHaveBeenCalledWith('/api/goals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  });

  it('patchGoal PATCHes goal id', async () => {
    await patchGoal(3, { isActive: false });
    expect(fetchJson).toHaveBeenCalledWith('/api/goals/3', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
  });

  it('removeGoal DELETEs goal id', async () => {
    await removeGoal(7);
    expect(fetchJson).toHaveBeenCalledWith('/api/goals/7', {
      method: 'DELETE',
    });
  });
});
