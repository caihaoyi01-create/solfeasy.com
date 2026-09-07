import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import {
  completeMusicLesson,
  getLearningStatus,
  startMusicTrial,
} from '@/modules/music-learning/service';
import { configuredMusicPaymentProvider } from '@/lib/music-learning';
import { respData, respErr } from '@/lib/resp';

const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('trial') }),
  z.object({
    action: z.literal('complete'),
    lessonId: z.string().max(40),
    notes: z.array(z.number().int().min(0).max(127)).max(32),
    intervals: z.array(z.number().min(0).max(60000)).max(31).optional(),
  }),
]);

async function paymentProvider() {
  const configs = await getAllConfigs();
  return configuredMusicPaymentProvider(configs);
}

async function GET({ request }: { request: Request }) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    const status = session?.user
      ? await getLearningStatus(session.user.id)
      : {
          signedIn: false,
          pro: false,
          subscriptionActive: false,
          trialUsed: false,
          trialEndsAt: null,
          progress: [],
        };
    return respData(
      { ...status, paymentProvider: await paymentProvider() },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return respErr('Unable to load learning progress. Please try again.', {
      status: 503,
    });
  }
}

async function POST({ request }: { request: Request }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return respErr('Invalid request origin', { status: 403 });
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user)
      return respErr('Sign in to save progress or start a trial.', {
        status: 401,
      });
    const parsed = command.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return respErr('Invalid lesson request.', { status: 400 });
    const result =
      parsed.data.action === 'trial'
        ? await startMusicTrial(session.user.id)
        : await completeMusicLesson(
            session.user.id,
            parsed.data.lessonId,
            parsed.data.notes,
            parsed.data.intervals
          );
    return respData(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to save. Please retry.',
      { status: 400 }
    );
  }
}

export const Route = createFileRoute('/api/music-learning')({
  server: { handlers: { GET, POST } },
});
