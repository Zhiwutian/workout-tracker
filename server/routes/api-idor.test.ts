import { randomBytes } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Cross-tenant / IDOR coverage. Requires PostgreSQL + migrated schema + seed (global exercises).
 * CI sets TEST_DATABASE_URL; locally: `TEST_DATABASE_URL=postgres://... pnpm run test:server`.
 */
const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!hasTestDb)('api IDOR (integration)', () => {
  let app: Express;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  function suffix(): string {
    return randomBytes(6).toString('hex');
  }

  async function signUp(name: string): Promise<string> {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ displayName: name })
      .expect(201);
    const token = res.body.data?.token as string | undefined;
    expect(token).toBeTruthy();
    return token!;
  }

  async function createWorkoutForToken(
    token: string,
    body?: Record<string, unknown>,
  ): Promise<number> {
    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send(body ?? {})
      .expect(201);
    return created.body.data.workoutId as number;
  }

  async function firstExerciseTypeId(token: string): Promise<number> {
    const exRes = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const exerciseTypeId = exRes.body.data[0]?.exerciseTypeId as
      | number
      | undefined;
    expect(exerciseTypeId).toBeDefined();
    return exerciseTypeId!;
  }

  it('returns 404 when user B reads user A workout by id', async () => {
    const t = suffix();
    const tokenA = await signUp(`idor-a-${t}`);
    const tokenB = await signUp(`idor-b-${t}`);

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    const res = await request(app)
      .get(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'workout not found',
      }),
    );
  });

  it('returns 404 when user B patches user A workout', async () => {
    const t = suffix();
    const tokenA = await signUp(`patch-a-${t}`);
    const tokenB = await signUp(`patch-b-${t}`);

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    await request(app)
      .patch(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'hacked' })
      .expect(404);
  });

  it('returns 404 when user B deletes user A workout', async () => {
    const t = suffix();
    const tokenA = await signUp(`del-a-${t}`);
    const tokenB = await signUp(`del-b-${t}`);

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('returns 404 when user B adds a set to user A workout', async () => {
    const t = suffix();
    const tokenA = await signUp(`set-a-${t}`);
    const tokenB = await signUp(`set-b-${t}`);

    const exRes = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const exerciseTypeId = exRes.body.data[0]?.exerciseTypeId as
      | number
      | undefined;
    expect(exerciseTypeId).toBeDefined();

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ exerciseTypeId, reps: 5, weight: 10 })
      .expect(404);
  });

  it('returns 400 when logging a resistance exercise on a cardio workout', async () => {
    const t = suffix();
    const token = await signUp(`wt-mismatch-${t}`);

    const exRes = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const rows = exRes.body.data as Array<{
      exerciseTypeId: number;
      category: string;
    }>;
    const resistance = rows.find((r) => r.category === 'resistance');
    expect(resistance).toBeDefined();

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ workoutType: 'cardio' })
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    const res = await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId: resistance!.exerciseTypeId,
        reps: 1,
        weight: 0,
      })
      .expect(400);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'exercise does not match this workout type',
      }),
    );
  });

  it('returns 404 when user B patches user A set', async () => {
    const t = suffix();
    const tokenA = await signUp(`pset-a-${t}`);
    const tokenB = await signUp(`pset-b-${t}`);

    const exRes = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const exerciseTypeId = exRes.body.data[0]?.exerciseTypeId as number;

    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    const workoutId = created.body.data.workoutId as number;

    const setRes = await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ exerciseTypeId, reps: 3, weight: 20 })
      .expect(201);
    const setId = setRes.body.data.setId as number;

    await request(app)
      .patch(`/api/sets/${setId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reps: 99 })
      .expect(404);
  });

  it('guest session: POST /api/auth/guest then GET /api/me has isGuest true', async () => {
    const res = await request(app).post('/api/auth/guest').expect(201);
    const token = res.body.data.token as string;
    expect(token).toBeTruthy();
    const me = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.isGuest).toBe(true);
    expect(me.body.data.displayName).toMatch(/^Guest /);
  });

  it('creates a superset group when createGroup=true and returns non-null groupId', async () => {
    const t = suffix();
    const token = await signUp(`superset-create-${t}`);
    const exerciseTypeId = await firstExerciseTypeId(token);
    const workoutId = await createWorkoutForToken(token);

    const res = await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 8,
        weight: 100,
        createGroup: true,
      })
      .expect(201);

    expect(typeof res.body.data.groupId).toBe('number');
    expect(res.body.data.groupId).toBeGreaterThan(0);
  });

  it('returns 400 for foreign superset group id', async () => {
    const t = suffix();
    const token = await signUp(`superset-foreign-${t}`);
    const exerciseTypeId = await firstExerciseTypeId(token);

    const workoutAId = await createWorkoutForToken(token);
    const workoutBId = await createWorkoutForToken(token);

    const grouped = await request(app)
      .post(`/api/workouts/${workoutAId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 8,
        weight: 100,
        createGroup: true,
      })
      .expect(201);
    const foreignGroupId = grouped.body.data.groupId as number;

    const res = await request(app)
      .post(`/api/workouts/${workoutBId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 6,
        weight: 80,
        groupId: foreignGroupId,
      })
      .expect(400);

    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'invalid superset group',
      }),
    );
  });

  it('patch /api/sets/:setId moves set to valid group and rejects foreign group', async () => {
    const t = suffix();
    const token = await signUp(`superset-patch-${t}`);
    const exerciseTypeId = await firstExerciseTypeId(token);

    const workoutAId = await createWorkoutForToken(token);
    const workoutBId = await createWorkoutForToken(token);

    const plainSet = await request(app)
      .post(`/api/workouts/${workoutAId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 8,
        weight: 100,
      })
      .expect(201);
    const setId = plainSet.body.data.setId as number;

    const groupASet = await request(app)
      .post(`/api/workouts/${workoutAId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 6,
        weight: 90,
        createGroup: true,
      })
      .expect(201);
    const validGroupId = groupASet.body.data.groupId as number;

    const moveOk = await request(app)
      .patch(`/api/sets/${setId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: validGroupId })
      .expect(200);
    expect(moveOk.body.data.groupId).toBe(validGroupId);

    const groupBSet = await request(app)
      .post(`/api/workouts/${workoutBId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 5,
        weight: 70,
        createGroup: true,
      })
      .expect(201);
    const invalidGroupId = groupBSet.body.data.groupId as number;

    const moveBad = await request(app)
      .patch(`/api/sets/${setId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId: invalidGroupId })
      .expect(400);
    expect(moveBad.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'invalid superset group',
      }),
    );
  });

  it('returns 409 when two sets use the same setIndex in one workout', async () => {
    const t = suffix();
    const token = await signUp(`superset-index-${t}`);
    const exerciseTypeId = await firstExerciseTypeId(token);
    const workoutId = await createWorkoutForToken(token);

    await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 8,
        weight: 100,
        setIndex: 0,
      })
      .expect(201);

    const conflict = await request(app)
      .post(`/api/workouts/${workoutId}/sets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exerciseTypeId,
        reps: 6,
        weight: 90,
        setIndex: 0,
      })
      .expect(409);

    expect(conflict.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message:
          'set index already exists for this workout. refresh and retry.',
      }),
    );
  });
});
