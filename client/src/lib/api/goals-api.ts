/** Weekly goals CRUD (`/api/goals`). */
import { fetchJson } from '@/lib/api-client';
import type {
  GoalTypeId,
  GoalWithProgress,
  GoalsListResponse,
} from '@/lib/api/types';

export async function readGoals(): Promise<GoalsListResponse> {
  return fetchJson<GoalsListResponse>('/api/goals');
}

export async function createGoal(input: {
  goalType: GoalTypeId;
  targetValue: number;
  workoutTypeFilter?: string | null;
  timezone?: string | null;
}): Promise<GoalWithProgress> {
  return fetchJson<GoalWithProgress>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchGoal(
  goalId: number,
  patch: {
    targetValue?: number;
    isActive?: boolean;
    workoutTypeFilter?: string | null;
    timezone?: string | null;
  },
): Promise<GoalWithProgress> {
  return fetchJson<GoalWithProgress>(`/api/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function removeGoal(goalId: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(`/api/goals/${goalId}`, {
    method: 'DELETE',
  });
}
