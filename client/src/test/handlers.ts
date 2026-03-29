import type { UiPreferences } from '@shared/ui-preferences';
import { http, HttpResponse } from 'msw';

const MOCK_TOKEN = 'msw-test-access-token';
const MOCK_GUEST_TOKEN = 'msw-guest-access-token';

/** In-memory profile prefs for MSW (PATCH /api/profile uiPreferences merge). */
let mockUiPreferences: UiPreferences | null = null;
let mockProfileWeightUnit: 'lb' | 'kg' = 'lb';

let mockWorkouts: {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  workoutType: string;
  startedAt: string;
  endedAt: string | null;
}[] = [];

type MockGoal = {
  id: number;
  goalType: string;
  targetValue: number;
  workoutTypeFilter: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPeriod: {
    periodStartUtc: string;
    periodEndUtc: string;
    status: string;
    progressValue: number | null;
    progress: number;
  } | null;
};

let mockGoals: MockGoal[] = [];
let nextMockGoalId = 1;

/** Reset in-memory API mock state between tests. */
export function resetApiMockState(): void {
  mockUiPreferences = null;
  mockProfileWeightUnit = 'lb';
  mockGoals = [];
  nextMockGoalId = 1;
  mockWorkouts = [
    {
      workoutId: 1,
      userId: 1,
      title: null,
      notes: null,
      workoutType: 'resistance',
      startedAt: new Date().toISOString(),
      endedAt: null,
    },
  ];
}

resetApiMockState();

function requireAuth(request: Request): boolean {
  const auth = request.headers.get('authorization');
  return (
    auth === `Bearer ${MOCK_TOKEN}` || auth === `Bearer ${MOCK_GUEST_TOKEN}`
  );
}

export const handlers = [
  http.get('/api/hello', () =>
    HttpResponse.json({ data: { message: 'Hello, World!' } }),
  ),

  http.get('/api/auth/options', () =>
    HttpResponse.json({ data: { oidc: false, demo: true } }),
  ),

  http.post('/api/auth/logout', () =>
    HttpResponse.json({ data: { ok: true } }),
  ),

  http.post('/api/auth/sign-in', async () =>
    HttpResponse.json({ data: { token: MOCK_TOKEN } }),
  ),

  http.post('/api/auth/sign-up', async () =>
    HttpResponse.json({ data: { token: MOCK_TOKEN } }, { status: 201 }),
  ),

  http.post('/api/auth/guest', async () =>
    HttpResponse.json({ data: { token: MOCK_GUEST_TOKEN } }, { status: 201 }),
  ),

  http.get('/api/me', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const auth = request.headers.get('authorization');
    const isGuest = auth === `Bearer ${MOCK_GUEST_TOKEN}`;
    return HttpResponse.json({
      data: {
        userId: 1,
        displayName: isGuest
          ? 'Guest 00000000-0000-4000-8000-000000000001'
          : 'Test Lifter',
        weightUnit: mockProfileWeightUnit,
        timezone: null,
        uiPreferences: mockUiPreferences,
        updatedAt: new Date().toISOString(),
        isGuest,
      },
    });
  }),

  http.get('/api/workouts', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: mockWorkouts });
  }),

  http.post('/api/workouts', async ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      workoutType?: string;
    };
    const nextId =
      mockWorkouts.reduce((m, w) => Math.max(m, w.workoutId), 0) + 1;
    const row = {
      workoutId: nextId,
      userId: 1,
      title: null as string | null,
      notes: null as string | null,
      workoutType: body.workoutType ?? 'resistance',
      startedAt: new Date().toISOString(),
      endedAt: null as string | null,
    };
    mockWorkouts = [row, ...mockWorkouts];
    return HttpResponse.json({ data: row }, { status: 201 });
  }),

  http.get('/api/workouts/:workoutId', ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const id = Number(params.workoutId);
    const w = mockWorkouts.find((x) => x.workoutId === id);
    if (!w) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'workout not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      data: { workout: w, sets: [] as unknown[] },
    });
  }),

  http.get('/api/exercises', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const url = new URL(request.url);
    const wt = url.searchParams.get('workoutType') ?? 'resistance';
    const all = [
      {
        exerciseTypeId: 1,
        userId: null as number | null,
        name: 'Back squat',
        muscleGroup: 'legs',
        category: 'resistance',
        archivedAt: null,
      },
      {
        exerciseTypeId: 2,
        userId: null as number | null,
        name: 'Running',
        muscleGroup: null as string | null,
        category: 'cardio',
        archivedAt: null,
      },
    ];
    const data = all.filter((e) => e.category === wt);
    return HttpResponse.json({ data });
  }),

  http.get('/api/exercises/recents', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const url = new URL(request.url);
    const wt = url.searchParams.get('workoutType') ?? 'resistance';
    const all = [
      {
        exerciseTypeId: 1,
        userId: null as number | null,
        name: 'Back squat',
        muscleGroup: 'legs',
        category: 'resistance',
        archivedAt: null,
      },
      {
        exerciseTypeId: 2,
        userId: null as number | null,
        name: 'Running',
        muscleGroup: null as string | null,
        category: 'cardio',
        archivedAt: null,
      },
    ];
    const data = all.filter((e) => e.category === wt);
    return HttpResponse.json({ data });
  }),

  http.get('/api/exercises/archived', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: [] as unknown[] });
  }),

  http.patch('/api/exercises/:exerciseTypeId', async ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      name?: string;
      muscleGroup?: string | null;
      category?: string;
      archived?: boolean;
    };
    const exerciseTypeId = Number(params.exerciseTypeId);
    return HttpResponse.json({
      data: {
        exerciseTypeId,
        userId: 1,
        name: body.name ?? 'Custom',
        muscleGroup: body.muscleGroup === undefined ? 'legs' : body.muscleGroup,
        category: body.category ?? 'resistance',
        archivedAt: body.archived ? new Date().toISOString() : null,
      },
    });
  }),

  http.post('/api/workouts/:workoutId/sets', async ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const workoutId = Number(params.workoutId);
    const body = (await request.json()) as {
      exerciseTypeId: number;
      reps: number;
      weight: number;
      notes?: string | null;
      isWarmup?: boolean;
      restSeconds?: number | null;
    };
    const row = {
      setId: Date.now(),
      workoutId,
      exerciseTypeId: body.exerciseTypeId,
      setIndex: 0,
      reps: body.reps,
      weight: body.weight,
      volume: body.reps * body.weight,
      notes: body.notes ?? null,
      isWarmup: body.isWarmup ?? false,
      restSeconds: body.restSeconds === undefined ? null : body.restSeconds,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: row }, { status: 201 });
  }),

  http.patch('/api/sets/:setId', async ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const setId = Number(params.setId);
    const body = (await request.json()) as {
      reps?: number;
      weight?: number;
      notes?: string | null;
      isWarmup?: boolean;
      restSeconds?: number | null;
    };
    const reps = body.reps ?? 8;
    const weight = body.weight ?? 0;
    return HttpResponse.json({
      data: {
        setId,
        workoutId: 1,
        exerciseTypeId: 1,
        setIndex: 0,
        reps,
        weight,
        volume: reps * weight,
        notes: body.notes ?? null,
        isWarmup: body.isWarmup ?? false,
        restSeconds: body.restSeconds === undefined ? null : body.restSeconds,
        createdAt: new Date().toISOString(),
      },
    });
  }),

  http.delete('/api/sets/:setId', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/stats/weekly-volume', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const url = new URL(request.url);
    const weekStart = url.searchParams.get('weekStart') ?? '2026-01-05';
    const timezone = url.searchParams.get('timezone');
    const startMs = new Date(`${weekStart}T00:00:00.000Z`).getTime();
    const weekEndUtc = new Date(
      startMs + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const data: Record<string, unknown> = {
      weekStart,
      weekStartUtc: `${weekStart}T00:00:00.000Z`,
      weekEndUtc,
      totalVolume: 1200,
      setCount: 3,
      workoutCount: 1,
    };
    if (timezone) {
      data.timezone = timezone;
    }
    return HttpResponse.json({ data });
  }),

  http.get('/api/stats/volume-series', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const url = new URL(request.url);
    const weeks = Math.min(
      52,
      Math.max(1, Number(url.searchParams.get('weeks') ?? '8')),
    );
    const series = [];
    const anchor = new Date('2026-03-23T00:00:00.000Z');
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const d = new Date(anchor.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = d.toISOString().slice(0, 10);
      series.push({
        weekStart,
        totalVolume: 100 * (i + 1),
        setCount: i + 1,
        workoutCount: 1,
      });
    }
    return HttpResponse.json({
      data: {
        weeks,
        timezone: 'UTC',
        series,
      },
    });
  }),

  http.get('/api/stats/summary', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      data: {
        summary: {
          timezone: 'UTC',
          currentWeekStart: '2026-03-23',
          previousWeekStart: '2026-03-16',
          currentWeek: {
            totalVolume: 800,
            setCount: 2,
            workoutCount: 1,
          },
          previousWeek: {
            totalVolume: 400,
            setCount: 1,
            workoutCount: 1,
          },
          streakDays: 1,
          activeDaysThisWeek: 1,
        },
        achievements: [
          { badgeId: 'first_log', unlockedAt: new Date().toISOString() },
        ],
      },
    });
  }),

  http.get('/api/goals', ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: { goals: mockGoals } });
  }),

  http.post('/api/goals', async ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      goalType?: string;
      targetValue?: number;
      workoutTypeFilter?: string | null;
      timezone?: string | null;
    };
    const now = new Date().toISOString();
    const id = nextMockGoalId++;
    const row: MockGoal = {
      id,
      goalType: body.goalType ?? 'weekly_volume',
      targetValue: body.targetValue ?? 1000,
      workoutTypeFilter: body.workoutTypeFilter ?? null,
      timezone: body.timezone ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      currentPeriod: {
        periodStartUtc: now,
        periodEndUtc: now,
        status: 'pending',
        progressValue: null,
        progress: 0,
      },
    };
    mockGoals.push(row);
    return HttpResponse.json({ data: row }, { status: 201 });
  }),

  http.patch('/api/goals/:goalId', async ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const goalId = Number(params.goalId);
    const body = (await request.json()) as {
      targetValue?: number;
      isActive?: boolean;
      workoutTypeFilter?: string | null;
      timezone?: string | null;
    };
    const idx = mockGoals.findIndex((g) => g.id === goalId);
    if (idx < 0) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'goal not found' } },
        { status: 404 },
      );
    }
    const cur = mockGoals[idx];
    const updated: MockGoal = {
      ...cur,
      targetValue:
        body.targetValue !== undefined ? body.targetValue : cur.targetValue,
      isActive: body.isActive !== undefined ? body.isActive : cur.isActive,
      workoutTypeFilter:
        body.workoutTypeFilter !== undefined
          ? body.workoutTypeFilter
          : cur.workoutTypeFilter,
      timezone: body.timezone !== undefined ? body.timezone : cur.timezone,
      updatedAt: new Date().toISOString(),
    };
    mockGoals[idx] = updated;
    return HttpResponse.json({ data: updated });
  }),

  http.delete('/api/goals/:goalId', ({ request, params }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const goalId = Number(params.goalId);
    const before = mockGoals.length;
    mockGoals = mockGoals.filter((g) => g.id !== goalId);
    if (mockGoals.length === before) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'goal not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.patch('/api/profile', async ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      weightUnit?: string;
      uiPreferences?: UiPreferences;
    };
    if (body.weightUnit === 'kg' || body.weightUnit === 'lb') {
      mockProfileWeightUnit = body.weightUnit;
    }
    if (body.uiPreferences && typeof body.uiPreferences === 'object') {
      mockUiPreferences = {
        ...(mockUiPreferences ?? {}),
        ...body.uiPreferences,
      };
    }
    return HttpResponse.json({
      data: {
        userId: 1,
        displayName: 'Test Lifter',
        weightUnit: mockProfileWeightUnit,
        timezone: null,
        uiPreferences: mockUiPreferences,
        updatedAt: new Date().toISOString(),
        isGuest: false,
      },
    });
  }),
];
