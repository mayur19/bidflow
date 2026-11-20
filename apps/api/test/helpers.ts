import type { Role } from '@bidflow/shared';
import pino from 'pino';
import type { Env } from '../src/config/env.js';
import { loadEnv } from '../src/config/env.js';
import type { Db } from '../src/db/pool.js';

export const silentLogger = pino({ level: 'silent' });

export const TEST_ORIGIN = 'http://localhost:5172';

export function testEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    APP_ORIGIN: TEST_ORIGIN,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/unused',
    SESSION_SECRET: 'test-secret-test-secret-test-secret-0123',
    LOG_LEVEL: 'silent',
    RATE_LIMIT_MAX: '10000',
    AUTH_RATE_LIMIT_MAX: '10000',
    ...overrides,
  });
}

export interface FakeDbOptions {
  readonly healthy?: boolean;
  /** When set, any session cookie resolves to a user with this role. */
  readonly sessionRole?: Role;
}

/** Database stand-in for HTTP tests: answers SELECT 1 and (optionally) session lookups. */
export function fakeDb({ healthy = true, sessionRole }: FakeDbOptions = {}): Db {
  return {
    query: async (sql: string) => {
      if (!healthy) throw new Error('connection refused');
      if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 }], rowCount: 1 };
      if (sessionRole && sql.includes('FROM sessions s')) {
        return {
          rows: [
            {
              user_id: '00000000-0000-4000-8000-000000000001',
              organization_id: '00000000-0000-4000-8000-0000000000aa',
              organization_name: 'Cedar Grove Hotels',
              email: 'user@cedargrove.example',
              display_name: 'Test User',
              role: sessionRole,
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    },
  } as unknown as Db;
}
