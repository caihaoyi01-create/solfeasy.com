import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

test('persisted grading enforces shared quota, idempotence, ownership, reveal and premium privacy', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'solfeasy-practice-'));
  process.env.DATABASE_URL = `file:${path.join(dir, 'test.db').replaceAll('\\', '/')}`;
  process.env.DATABASE_PROVIDER = 'sqlite';
  const { db } = await import('../src/core/db');
  const setup = db().$client;
  await setup.executeMultiple(`
    CREATE TABLE music_practice_day (id TEXT PRIMARY KEY, owner TEXT NOT NULL, day TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0, private INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
    CREATE TABLE music_practice_question (id TEXT PRIMARY KEY, owner TEXT NOT NULL, clef TEXT NOT NULL, midi INTEGER NOT NULL, created_at INTEGER NOT NULL, graded_at INTEGER, correct INTEGER);
  `);
  const {
    createQuestion,
    gradeQuestion,
    practiceState,
    publicPractice,
    setPracticePrivacy,
  } = await import('../src/modules/music-practice/service');
  try {
    const visitor = 'guest:test',
      now = Date.now();
    const first = await createQuestion(visitor, 'treble', now);
    assert.equal(
      (await createQuestion(visitor, 'treble', now)).id,
      first.id,
      'refresh reuses pending question'
    );
    await assert.rejects(
      () => gradeQuestion('guest:another', first.id, first.midi, false, now),
      /QUESTION_EXPIRED/
    );
    const result = await gradeQuestion(
      visitor,
      first.id,
      first.midi,
      false,
      now
    );
    assert.equal(result.state.attempts, 1);
    assert.equal(result.state.correct, 1);
    assert.equal(result.state.streak, 1);
    const repeat = await gradeQuestion(
      visitor,
      first.id,
      first.midi,
      false,
      now
    );
    assert.equal(repeat.repeated, true);
    assert.equal(repeat.state.attempts, 1);
    const second = await createQuestion(visitor, 'bass', now);
    const revealed = await gradeQuestion(visitor, second.id, null, false, now);
    assert.equal(revealed.correct, false);
    assert.equal(revealed.state.attempts, 2);
    assert.equal(revealed.state.streak, 0);
    for (let index = 2; index < 20; index++) {
      const question = await createQuestion(
        visitor,
        index % 2 ? 'treble' : 'bass',
        now
      );
      await gradeQuestion(visitor, question.id, question.midi, false, now);
    }
    assert.equal((await practiceState(visitor, false, now)).remaining, 0);
    const blocked = await createQuestion(visitor, 'bass', now);
    await assert.rejects(
      () => gradeQuestion(visitor, blocked.id, blocked.midi, false, now),
      /DAILY_LIMIT/
    );
    assert.equal((await practiceState(visitor, false, now)).attempts, 20);
    const premium = await gradeQuestion(
      visitor,
      blocked.id,
      blocked.midi,
      true,
      now
    );
    assert.equal(premium.state.attempts, 21);
    assert.equal(premium.state.remaining, null);
    const highlights = await publicPractice(now);
    assert.ok(highlights.length > 0);
    assert.deepEqual(Object.keys(highlights[0]).sort(), [
      'attempts',
      'best',
      'correct',
    ]);
    await assert.rejects(
      () => setPracticePrivacy(visitor, true, false),
      /PREMIUM_REQUIRED/
    );
    await setPracticePrivacy(visitor, true, true);
    assert.equal((await publicPractice(now)).length, 0);
    const nextDay = await practiceState(visitor, false, now + 86400000);
    assert.equal(nextDay.remaining, 20);
    assert.equal(nextDay.attempts, 0);
    assert.equal(nextDay.private, true, 'privacy persists across daily reset');
    const duplicateQuestions = await Promise.all([
      createQuestion('guest:duplicate-create', 'treble', now),
      createQuestion('guest:duplicate-create', 'treble', now),
    ]);
    assert.equal(duplicateQuestions[0].id, duplicateQuestions[1].id);
    const privateQuestion = await createQuestion(
      'user:privacy-race',
      'treble',
      now
    );
    await Promise.all([
      gradeQuestion(
        'user:privacy-race',
        privateQuestion.id,
        privateQuestion.midi,
        true,
        now
      ),
      setPracticePrivacy('user:privacy-race', true, true),
    ]);
    assert.equal(
      (await practiceState('user:privacy-race', true, now)).private,
      true
    );
    await assert.rejects(
      () =>
        gradeQuestion(
          'guest:duplicate-create',
          duplicateQuestions[0].id,
          null,
          false,
          now + 86400001
        ),
      /QUESTION_EXPIRED/
    );
    const concurrent = await createQuestion('guest:concurrent', 'treble', now);
    await Promise.all([
      gradeQuestion(
        'guest:concurrent',
        concurrent.id,
        concurrent.midi,
        false,
        now
      ),
      gradeQuestion(
        'guest:concurrent',
        concurrent.id,
        concurrent.midi,
        false,
        now
      ),
    ]);
    assert.equal(
      (await practiceState('guest:concurrent', false, now)).attempts,
      1
    );
    for (let index = 1; index < 19; index++) {
      const question = await createQuestion('guest:concurrent', 'treble', now);
      await gradeQuestion(
        'guest:concurrent',
        question.id,
        question.midi,
        false,
        now
      );
    }
    const finalTreble = await createQuestion('guest:concurrent', 'treble', now);
    const finalBass = await createQuestion('guest:concurrent', 'bass', now);
    const race = await Promise.allSettled([
      gradeQuestion(
        'guest:concurrent',
        finalTreble.id,
        finalTreble.midi,
        false,
        now
      ),
      gradeQuestion(
        'guest:concurrent',
        finalBass.id,
        finalBass.midi,
        false,
        now
      ),
    ]);
    assert.equal(
      race.filter((result) => result.status === 'fulfilled').length,
      1
    );
    assert.equal(
      (await practiceState('guest:concurrent', false, now)).attempts,
      20
    );
  } finally {
    setup.close();
    // Native libsql transaction connections release their Windows file handles
    // when this isolated test process exits. Its database stays in OS temp.
  }
});
