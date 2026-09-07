import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

import { subscription } from '../src/config/db/schema';
import { envConfigs } from '../src/config/index';
import { db } from '../src/core/db';
import {
  configuredMusicPaymentProvider,
  hasEffectiveMusicSubscription,
  TRIAL_DURATION_MS,
  validateLessonAttempt,
} from '../src/lib/music-learning';
import {
  musicLessonProgress,
  musicTrial,
} from '../src/modules/music-learning/schema';
import {
  completeMusicLesson,
  getLearningStatus,
  isMusicPro,
  startMusicTrial,
} from '../src/modules/music-learning/service';

// In-memory SQLite: never touches the user's development database.
envConfigs.database_provider = 'sqlite';
envConfigs.database_url = ':memory:';
envConfigs.db_singleton_enabled = 'true';

before(async () => {
  const client = db().$client;
  const columns = getTableConfig(subscription)
    .columns.map((column) => `"${column.name}" ${column.getSQLType()}`)
    .join(',');
  await client.execute(`CREATE TABLE subscription (${columns})`);
  await client.execute(
    'CREATE TABLE music_trial (user_id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ends_at INTEGER NOT NULL)'
  );
  await client.execute(
    'CREATE TABLE music_lesson_progress (user_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at INTEGER NOT NULL, PRIMARY KEY (user_id, lesson_id))'
  );
});

test('concurrent trial activation grants exactly one seven-day trial', async () => {
  await Promise.all(
    Array.from({ length: 5 }, () => startMusicTrial('trial-user'))
  );
  const rows = await db()
    .select()
    .from(musicTrial)
    .where(eq(musicTrial.userId, 'trial-user'));
  assert.equal(rows.length, 1);
  assert.equal(
    rows[0].endsAt.getTime() - rows[0].startedAt.getTime(),
    TRIAL_DURATION_MS
  );
  assert.equal(await isMusicPro('trial-user'), true);
});

test('expired trial never restarts and restores Free entitlement', async () => {
  await db()
    .insert(musicTrial)
    .values({
      userId: 'expired-user',
      startedAt: new Date(0),
      endsAt: new Date(TRIAL_DURATION_MS),
    });
  const result = await startMusicTrial('expired-user');
  assert.equal(result.pro, false);
  assert.equal(result.trialUsed, true);
  assert.equal(result.trialEndsAt, new Date(TRIAL_DURATION_MS).toISOString());
});

test('only current, recognized subscriptions grant Pro, including pending cancellation', () => {
  const now = new Date('2026-09-07T00:00:00Z');
  const active = {
    productId: 'solfeasy_pro_monthly',
    status: 'active',
    currentPeriodEnd: new Date('2026-10-07T00:00:00Z'),
  };
  assert.equal(hasEffectiveMusicSubscription(active, now), true);
  assert.equal(
    hasEffectiveMusicSubscription({ ...active, status: 'pending_cancel' }, now),
    true
  );
  assert.equal(
    hasEffectiveMusicSubscription({ ...active, status: 'pending' }, now),
    false
  );
  assert.equal(
    hasEffectiveMusicSubscription({ ...active, status: 'canceled' }, now),
    false
  );
  assert.equal(
    hasEffectiveMusicSubscription({ ...active, currentPeriodEnd: now }, now),
    false
  );
  assert.equal(
    hasEffectiveMusicSubscription({ ...active, currentPeriodEnd: null }, now),
    false
  );
  assert.equal(
    hasEffectiveMusicSubscription(
      { ...active, productId: 'arbitrary-plan' },
      now
    ),
    false
  );
});

test('paid subscriptions grant server entitlement independently of a trial', async () => {
  await db()
    .insert(subscription)
    .values({
      id: 'paid-plan',
      subscriptionNo: 'paid-plan',
      userId: 'paid-user',
      status: 'active',
      paymentProvider: 'stripe',
      subscriptionId: 'test-sub',
      productId: 'solfeasy_pro_yearly',
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });
  const status = await getLearningStatus('paid-user');
  assert.equal(status.pro, true);
  assert.equal(status.subscriptionActive, true);
  assert.equal(status.trialUsed, false);
});

test('progress rejects unknown, incomplete, incorrect and locked exercises', async () => {
  await assert.rejects(
    completeMusicLesson('free-user', 'arbitrary-lesson', [60]),
    /Unknown lesson/
  );
  await assert.rejects(
    completeMusicLesson('free-user', 'middle-c', [60]),
    /full exercise/
  );
  await assert.rejects(
    completeMusicLesson('free-user', 'middle-c', [60, 62, 65, 62, 60]),
    /full exercise/
  );
  await assert.rejects(
    completeMusicLesson(
      'free-user',
      'first-melody',
      [64, 62, 60, 62, 64, 64, 64]
    ),
    /active trial/
  );
});

test('completion is saved once and scoped to its account', async () => {
  await completeMusicLesson('free-user', 'middle-c', [60, 62, 64, 62, 60]);
  await completeMusicLesson('free-user', 'middle-c', [60, 62, 64, 62, 60]);
  const rows = await db()
    .select()
    .from(musicLessonProgress)
    .where(eq(musicLessonProgress.userId, 'free-user'));
  assert.equal(rows.length, 1);
  assert.deepEqual((await getLearningStatus('free-user')).progress, [
    'middle-c',
  ]);
  assert.deepEqual((await getLearningStatus('another-user')).progress, []);
});

test('rhythm lesson validates onset timing as well as the note sequence', () => {
  const notes = [60, 60, 64, 64, 67];
  assert.equal(
    validateLessonAttempt('steady-rhythm', notes, [750, 750, 1500, 1500]),
    true
  );
  assert.equal(
    validateLessonAttempt('steady-rhythm', notes, [30, 40, 30, 50]),
    false
  );
  assert.equal(validateLessonAttempt('steady-rhythm', notes), false);
  assert.equal(
    validateLessonAttempt('steady-rhythm', notes, [750, NaN, 1500, 1500]),
    false
  );
});

test('checkout readiness requires recurring provider credentials and complete Creem mapping', () => {
  assert.equal(configuredMusicPaymentProvider({}), null);
  assert.equal(
    configuredMusicPaymentProvider({ stripe_secret_key: 'test' }),
    null
  );
  assert.equal(
    configuredMusicPaymentProvider({
      stripe_secret_key: 'test',
      stripe_signing_secret: 'test',
    }),
    'stripe'
  );
  const creem = {
    creem_enabled: 'true',
    creem_api_key: 'test',
    creem_signing_secret: 'test',
  };
  assert.equal(configuredMusicPaymentProvider(creem), null);
  assert.equal(
    configuredMusicPaymentProvider({
      ...creem,
      creem_product_ids_mapping: '{invalid}',
    }),
    null
  );
  assert.equal(
    configuredMusicPaymentProvider({
      ...creem,
      creem_product_ids_mapping: JSON.stringify({
        solfeasy_pro_monthly: 'prod_month',
        solfeasy_pro_yearly: 'prod_year',
      }),
    }),
    'creem'
  );
});
