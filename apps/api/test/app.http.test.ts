import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { fakeDb, silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';

/** HTTP-level tests that need no database: the fake pool only answers SELECT 1. */
function app(healthy = true) {
  return createApp({
    env: testEnv(),
    logger: silentLogger,
    db: fakeDb({ healthy }),
    version: 'test',
  });
}

describe('HTTP surface', () => {
  it('reports liveness without touching the database', async () => {
    const res = await request(app(false)).get('/api/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { status: 'ok', version: 'test' },
      error: null,
    });
  });

  it('reports readiness failure as 503 when the database is down', async () => {
    const res = await request(app(false)).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('sets security headers and a request id', async () => {
    const res = await request(app()).get('/api/health/live');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toMatch(/[0-9a-f-]{36}/);
  });

  it('returns 404 envelopes for unknown routes', async () => {
    const res = await request(app()).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, data: null, error: { code: 'NOT_FOUND' } });
  });

  it('requires authentication for /me and pending modules', async () => {
    expect((await request(app()).get('/api/v1/me')).status).toBe(401);
    expect((await request(app()).get('/api/v1/rfqs')).status).toBe(401);
    expect((await request(app()).get('/api/v1/departments')).status).toBe(401);
  });

  it('rejects cross-origin state-changing requests', async () => {
    const res = await request(app())
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@b.co', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_FAILED');
  });

  it('validates login payloads', async () => {
    const res = await request(app())
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .send({ email: 'bad' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects malformed JSON with 422 instead of 500', async () => {
    const res = await request(app())
      .post('/api/v1/auth/login')
      .set('Origin', TEST_ORIGIN)
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(422);
  });
});
