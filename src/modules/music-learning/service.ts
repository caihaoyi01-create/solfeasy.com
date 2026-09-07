import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { withMusicWrite } from '@/core/db/music-write-lock';
import { subscription } from '@/config/db/schema';
import {
  hasEffectiveMusicSubscription,
  lessonExercises,
  TRIAL_DURATION_MS,
  validateLessonAttempt,
} from '@/lib/music-learning';

import { musicLessonProgress, musicTrial } from './schema';

export async function isMusicPro(userId: string): Promise<boolean> {
  const now = new Date();
  const trials: (typeof musicTrial.$inferSelect)[] = await db()
    .select()
    .from(musicTrial)
    .where(eq(musicTrial.userId, userId))
    .limit(1);
  if (trials[0] && trials[0].endsAt > now) return true;
  const subscriptions: (typeof subscription.$inferSelect)[] = await db()
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId));
  return subscriptions.some((item) => hasEffectiveMusicSubscription(item, now));
}

export async function getLearningStatus(userId: string) {
  const [trials, progress, subscriptions] = await Promise.all([
    db()
      .select()
      .from(musicTrial)
      .where(eq(musicTrial.userId, userId))
      .limit(1) as Promise<(typeof musicTrial.$inferSelect)[]>,
    db()
      .select()
      .from(musicLessonProgress)
      .where(eq(musicLessonProgress.userId, userId)) as Promise<
      (typeof musicLessonProgress.$inferSelect)[]
    >,
    db()
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId)) as Promise<
      (typeof subscription.$inferSelect)[]
    >,
  ]);
  const now = new Date();
  const subscriptionActive = subscriptions.some((item) =>
    hasEffectiveMusicSubscription(item, now)
  );
  const pro =
    subscriptionActive || Boolean(trials[0] && trials[0].endsAt > now);
  return {
    signedIn: true,
    pro,
    subscriptionActive,
    trialUsed: Boolean(trials[0]),
    trialEndsAt: trials[0]?.endsAt.toISOString() ?? null,
    progress: progress.map((item) => item.lessonId),
  };
}

export async function startMusicTrial(userId: string) {
  return withMusicWrite(async () => {
    const now = new Date();
    // The primary key makes retries and concurrent requests idempotent. Never extend a used trial.
    await db()
      .insert(musicTrial)
      .values({
        userId,
        startedAt: now,
        endsAt: new Date(now.getTime() + TRIAL_DURATION_MS),
      })
      .onConflictDoNothing();
    return getLearningStatus(userId);
  });
}

export async function completeMusicLesson(
  userId: string,
  lessonId: string,
  notes: number[],
  intervals?: number[]
) {
  return withMusicWrite(async () => {
    const lesson = lessonExercises.find((item) => item.id === lessonId);
    if (!lesson) throw new Error('Unknown lesson');
    if (lesson.premium && !(await isMusicPro(userId)))
      throw new Error(
        'An active trial or Pro plan is required for this lesson.'
      );
    if (!validateLessonAttempt(lessonId, notes, intervals))
      throw new Error(
        'Play the full exercise correctly before saving. For the rhythm lesson, follow the 80 bpm pulse.'
      );
    await db()
      .insert(musicLessonProgress)
      .values({ userId, lessonId, completedAt: new Date() })
      .onConflictDoNothing();
    return getLearningStatus(userId);
  });
}
