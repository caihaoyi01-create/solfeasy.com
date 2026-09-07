import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { isMusicPro } from '@/modules/music-learning/service';
import {
  createQuestion,
  gradeQuestion,
  practiceState,
  publicPractice,
  setPracticePrivacy,
} from '@/modules/music-practice/service';
import { getCookieFromHeader } from '@/lib/cookie';
import { respData, respErr } from '@/lib/resp';

const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('question'), clef: z.enum(['treble', 'bass']) }),
  z.object({
    action: z.literal('grade'),
    questionId: z.string().uuid(),
    answer: z.number().int().min(0).max(127).nullable(),
  }),
  z.object({ action: z.literal('privacy'), private: z.boolean() }),
]);
async function identity(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  const stored = getCookieFromHeader(
    request.headers.get('cookie'),
    'sf_practice'
  );
  const visitor =
    stored && /^[0-9a-f-]{36}$/.test(stored) ? stored : crypto.randomUUID();
  return {
    owner: session?.user ? `user:${session.user.id}` : `guest:${visitor}`,
    premium: session?.user ? await isMusicPro(session.user.id) : false,
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': `sf_practice=${visitor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    },
  };
}
async function GET({ request }: { request: Request }) {
  try {
    const { owner, premium, headers } = await identity(request);
    return respData(
      {
        state: await practiceState(owner, premium),
        activity: await publicPractice(),
      },
      { headers }
    );
  } catch {
    return respErr('PRACTICE_UNAVAILABLE', { status: 503 });
  }
}
async function POST({ request }: { request: Request }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return respErr('INVALID_ORIGIN', { status: 403 });
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return respErr('INVALID_INPUT', { status: 400 });
    const { owner, premium, headers } = await identity(request),
      body = parsed.data;
    if (body.action === 'question')
      return respData(await createQuestion(owner, body.clef), { headers });
    if (body.action === 'privacy')
      return respData(await setPracticePrivacy(owner, body.private, premium), {
        headers,
      });
    return respData(
      await gradeQuestion(owner, body.questionId, body.answer, premium),
      { headers }
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      ['DAILY_LIMIT', 'QUESTION_EXPIRED', 'PREMIUM_REQUIRED'].includes(
        error.message
      )
        ? error.message
        : 'PRACTICE_UNAVAILABLE';
    return respErr(message, {
      status: message === 'PRACTICE_UNAVAILABLE' ? 503 : 409,
    });
  }
}
export const Route = createFileRoute('/api/music-practice')({
  server: { handlers: { GET, POST } },
});
