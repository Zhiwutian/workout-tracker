import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@server/services/workout-service.js', () => ({
  listWorkouts: vi.fn(async () => [
    {
      workoutId: 1,
      userId: 1,
      title: 'Leg day',
      notes: null,
      startedAt: new Date('2026-01-01T12:00:00.000Z'),
      endedAt: null,
    },
  ]),
}));

describe('api envelope', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://x';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns success envelope for GET /api/workouts with auth', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.TOKEN_SECRET!);
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        workoutId: 1,
        title: 'Leg day',
      }),
    );
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns validation error envelope for bad POST /api/auth/sign-up payload', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({})
      .expect(400);

    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'validation_error',
        message: 'request validation failed',
      }),
    );
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });
});
