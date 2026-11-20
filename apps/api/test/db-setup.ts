import { createApp } from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { createPool, type Db } from '../src/db/pool.js';
import { DEMO_PASSWORD, seed } from '../src/db/seed.js';
import { silentLogger, testEnv, TEST_ORIGIN } from './helpers.js';
import request from 'supertest';

/** Disposable database URL; integration suites are skipped when it is absent. */
export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

/** Drop and rebuild the test schema, then apply migrations and the dev seed. */
export async function freshDatabase(): Promise<Db> {
  const db = createPool({ DATABASE_URL: testDatabaseUrl!, DATABASE_POOL_MAX: 4 });
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await runMigrations(db, silentLogger);
  await seed(db, silentLogger);
  return db;
}

export interface SignedInAgent {
  readonly agent: ReturnType<typeof request.agent>;
  readonly csrf: string;
}

/** Log in as a seeded demo user and return a cookie-carrying agent plus CSRF token. */
export async function signIn(db: Db, email: string): Promise<SignedInAgent> {
  const agent = request.agent(
    createApp({ env: testEnv(), logger: silentLogger, db, version: 'test' }),
  );
  const res = await agent
    .post('/api/v1/auth/login')
    .set('Origin', TEST_ORIGIN)
    .send({ email, password: DEMO_PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return { agent, csrf: res.body.data.csrfToken as string };
}
