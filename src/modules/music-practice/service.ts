import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { withMusicWrite } from '@/core/db/music-write-lock';
import {
  musicPracticeDay as days,
  musicPracticeQuestion as questions,
} from '@/config/db/music-practice-schema';
import { naturalNotes, type Clef } from '@/lib/music-theory';

export const DAILY_LIMIT = 20;
export function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}
export function dayKey(owner: string, now = Date.now()) {
  return `${owner}:${utcDay(now)}`;
}

export async function practiceState(
  owner: string,
  premium: boolean,
  now = Date.now()
) {
  const [day] = await db()
    .select()
    .from(days)
    .where(eq(days.id, dayKey(owner, now)));
  const [previous] = day
    ? []
    : await db()
        .select({ private: days.private })
        .from(days)
        .where(eq(days.owner, owner))
        .orderBy(desc(days.updatedAt))
        .limit(1);
  return {
    attempts: day?.attempts ?? 0,
    correct: day?.correct ?? 0,
    streak: day?.streak ?? 0,
    best: day?.best ?? 0,
    private: day?.private ?? previous?.private ?? false,
    premium,
    remaining: premium ? null : Math.max(0, DAILY_LIMIT - (day?.attempts ?? 0)),
    limit: DAILY_LIMIT,
    resetsAt: new Date(
      Date.parse(`${utcDay(now)}T00:00:00Z`) + 86400000
    ).toISOString(),
  };
}
export async function createQuestion(
  owner: string,
  clef: Clef,
  now = Date.now()
) {
  return withMusicWrite(async () => {
    // Reuse an unanswered question across refreshes; changing clefs still shares one allowance.
    const [pending] = await db()
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.owner, owner),
          eq(questions.clef, clef),
          isNull(questions.gradedAt),
          gte(questions.createdAt, now - 86400000)
        )
      )
      .orderBy(desc(questions.createdAt))
      .limit(1);
    if (pending) return { id: pending.id, midi: pending.midi, clef };
    const range =
      clef === 'treble' ? naturalNotes(60, 72) : naturalNotes(36, 60);
    const random = crypto.getRandomValues(new Uint32Array(1))[0];
    const question = {
      id: crypto.randomUUID(),
      owner,
      clef,
      midi: range[random % range.length],
      createdAt: now,
    };
    await db().insert(questions).values(question);
    return { id: question.id, midi: question.midi, clef };
  });
}
export async function gradeQuestion(
  owner: string,
  questionId: string,
  answer: number | null,
  premium: boolean,
  now = Date.now()
) {
  const result = await withMusicWrite<{
    correct: boolean;
    answer: number;
    repeated: boolean;
  }>(() =>
    db().transaction(async (tx: ReturnType<typeof db>) => {
      const [question] = await tx
        .select()
        .from(questions)
        .where(and(eq(questions.id, questionId), eq(questions.owner, owner)));
      if (!question || question.createdAt < now - 86400000)
        throw new Error('QUESTION_EXPIRED');
      if (question.gradedAt !== null)
        return {
          correct: question.correct,
          answer: question.midi,
          repeated: true,
        };
      const key = dayKey(owner, now),
        correct = answer === question.midi;
      const [previous] = await tx
        .select({ private: days.private })
        .from(days)
        .where(eq(days.owner, owner))
        .orderBy(desc(days.updatedAt))
        .limit(1);
      await tx
        .insert(days)
        .values({ id: key, owner, day: utcDay(now), updatedAt: now })
        .onConflictDoNothing();
      const changed = await tx
        .update(days)
        .set({
          attempts: sql`${days.attempts} + 1`,
          correct: sql`${days.correct} + ${correct ? 1 : 0}`,
          streak: correct ? sql`${days.streak} + 1` : 0,
          best: correct
            ? sql`max(${days.best}, ${days.streak} + 1)`
            : sql`${days.best}`,
          updatedAt: now,
          private: previous?.private ?? false,
        })
        .where(
          and(
            eq(days.id, key),
            ...(premium ? [] : [lt(days.attempts, DAILY_LIMIT)])
          )
        )
        .returning({ id: days.id });
      if (!changed.length) throw new Error('DAILY_LIMIT');
      await tx
        .update(questions)
        .set({ gradedAt: now, correct })
        .where(eq(questions.id, questionId));
      return { correct, answer: question.midi, repeated: false };
    })
  );
  return { ...result, state: await practiceState(owner, premium, now) };
}
export async function publicPractice(now = Date.now()) {
  // No owner IDs, question IDs, names, emails, or exact timestamps leave this query.
  return db()
    .select({ correct: days.correct, attempts: days.attempts, best: days.best })
    .from(days)
    .where(
      and(
        eq(days.day, utcDay(now)),
        eq(days.private, false),
        gte(days.attempts, 3)
      )
    )
    .orderBy(desc(days.updatedAt))
    .limit(6);
}
export async function setPracticePrivacy(
  owner: string,
  privateResult: boolean,
  premium: boolean
) {
  if (!premium) throw new Error('PREMIUM_REQUIRED');
  const now = Date.now();
  await withMusicWrite(async () => {
    await db()
      .insert(days)
      .values({
        id: dayKey(owner, now),
        owner,
        day: utcDay(now),
        updatedAt: now,
        private: privateResult,
      })
      .onConflictDoUpdate({
        target: days.id,
        set: { private: privateResult, updatedAt: now },
      });
  });
  return practiceState(owner, premium, now);
}
