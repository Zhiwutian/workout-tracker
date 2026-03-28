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
});
