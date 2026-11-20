import { DomainError } from '@bidflow/shared';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middleware/error-handler.js';
import { silentLogger } from './helpers.js';

function appThrowing(error: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler(silentLogger));
  return app;
}

describe('error handler', () => {
  it('maps domain errors to 422 with the domain code and issues', async () => {
    const res = await request(
      appThrowing(
        new DomainError('INVALID_CRITERIA', 'Evaluation criteria are invalid', [{ code: 'X' }]),
      ),
    ).get('/boom');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_FAILED',
      message: 'Evaluation criteria are invalid',
      details: { domainCode: 'INVALID_CRITERIA', issues: [{ code: 'X' }] },
    });
  });

  it('omits issues when a domain error has no details', async () => {
    const res = await request(appThrowing(new DomainError('AMOUNT_OVERFLOW', 'too big'))).get(
      '/boom',
    );
    expect(res.body.error.details).toEqual({ domainCode: 'AMOUNT_OVERFLOW' });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const res = await request(appThrowing(new Error('secret SQL detail'))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('An unexpected error occurred');
  });
});
