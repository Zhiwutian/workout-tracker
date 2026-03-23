import { http, HttpResponse } from 'msw';

const MOCK_TOKEN = 'msw-test-access-token';
const MOCK_GUEST_TOKEN = 'msw-guest-access-token';

let mockWorkouts: {
  workoutId: number;
  userId: number;
  title: string | null;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
}[] = [];

/** Reset in-memory API mock state between tests. */
export function resetApiMockState(): void {
  mockWorkouts = [
    {
      workoutId: 1,
      userId: 1,
      title: null,
      notes: null,
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
        weightUnit: 'lb',
        timezone: null,
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
    const nextId =
      mockWorkouts.reduce((m, w) => Math.max(m, w.workoutId), 0) + 1;
    const row = {
      workoutId: nextId,
      userId: 1,
      title: null as string | null,
      notes: null as string | null,
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
    return HttpResponse.json({
      data: [
        {
          exerciseTypeId: 1,
          userId: null,
          name: 'Back squat',
          muscleGroup: 'legs',
        },
      ],
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
    };
    const row = {
      setId: Date.now(),
      workoutId,
      exerciseTypeId: body.exerciseTypeId,
      setIndex: 0,
      reps: body.reps,
      weight: body.weight,
      volume: body.reps * body.weight,
      notes: null as string | null,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: row }, { status: 201 });
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
    return HttpResponse.json({
      data: {
        weekStart,
        weekStartUtc: `${weekStart}T00:00:00.000Z`,
        weekEndUtc: `${weekStart}T00:00:00.000Z`,
        totalVolume: 1200,
        setCount: 3,
      },
    });
  }),

  http.patch('/api/profile', async ({ request }) => {
    if (!requireAuth(request)) {
      return HttpResponse.json(
        { error: { code: 'client_error', message: 'authentication required' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      data: {
        userId: 1,
        displayName: 'Test Lifter',
        weightUnit: 'kg',
        timezone: null,
        updatedAt: new Date().toISOString(),
        isGuest: false,
      },
    });
  }),
];
