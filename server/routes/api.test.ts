import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

describe('api routes', () => {
  let app: Express;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalTokenSecret = process.env.TOKEN_SECRET;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterAll(() => {
    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  it('returns auth options from /api/auth/options', async () => {
    const res = await request(app).get('/api/auth/options').expect(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        oidc: false,
        demo: true,
      }),
    );
  });

  it('returns hello message from /api/hello', async () => {
    const res = await request(app).get('/api/hello').expect(200);
    expect(res.body.data).toEqual({ message: 'Hello, World!' });
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns not_configured from /api/health when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.data.api).toBe('ok');
    expect(res.body.data.database).toBe('not_configured');
    expect(typeof res.body.data.checkedAt).toBe('string');
  });

  it('returns 503 from /api/ready when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/ready').expect(503);
    expect(res.body.data.database).toBe('not_configured');
  });

  it('returns 401 from /api/workouts without bearer token', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).get('/api/workouts').expect(401);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'authentication required',
      }),
    );
  });

  it('returns 401 from /api/export/workout-sets.csv without bearer token', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app)
      .get('/api/export/workout-sets.csv')
      .expect(401);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: 'authentication required',
      }),
    );
  });

  it('returns 503 from POST /api/auth/guest when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    const res = await request(app).post('/api/auth/guest').expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('database is not configured'),
      }),
    );
  });

  it('returns 503 from /api/workouts when DATABASE_URL is missing but token present', async () => {
    delete process.env.DATABASE_URL;
    const token = jwt.sign({ userId: 1 }, process.env.TOKEN_SECRET!);

    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);
    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'client_error',
        message: expect.stringContaining('database is not configured'),
      }),
    );
  });

  it('returns 401 from dashboard stats and goals routes without bearer token', async () => {
    delete process.env.DATABASE_URL;

    for (const path of [
      '/api/stats/summary',
      '/api/stats/volume-series?weeks=4',
      '/api/goals',
    ]) {
      const res = await request(app).get(path).expect(401);
      expect(res.body.error).toEqual(
        expect.objectContaining({
          code: 'client_error',
          message: 'authentication required',
        }),
      );
    }
  });

  it('returns 503 from dashboard stats and goals when DATABASE_URL missing but token present', async () => {
    delete process.env.DATABASE_URL;
    const token = jwt.sign({ userId: 1 }, process.env.TOKEN_SECRET!);
    const auth = { Authorization: `Bearer ${token}` };

    for (const path of [
      '/api/stats/summary',
      '/api/stats/volume-series?weeks=4',
      '/api/goals',
    ]) {
      const res = await request(app).get(path).set(auth).expect(503);
      expect(res.body.error).toEqual(
        expect.objectContaining({
          code: 'client_error',
          message: expect.stringContaining('database is not configured'),
        }),
      );
    }

    const postGoal = await request(app)
      .post('/api/goals')
      .set(auth)
      .send({ goalType: 'weekly_volume', targetValue: 1000 })
      .expect(503);
    expect(postGoal.body.error.message).toContain('database is not configured');

    const patchGoal = await request(app)
      .patch('/api/goals/1')
      .set(auth)
      .send({ isActive: false })
      .expect(503);
    expect(patchGoal.body.error.message).toContain(
      'database is not configured',
    );

    const delGoal = await request(app)
      .delete('/api/goals/1')
      .set(auth)
      .expect(503);
    expect(delGoal.body.error.message).toContain('database is not configured');
  });
});
