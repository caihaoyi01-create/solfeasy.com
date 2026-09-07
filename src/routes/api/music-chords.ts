import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { discoverChord, recentChords } from '@/modules/music-chords/service';
import { isMusicPro } from '@/modules/music-learning/service';
import { practiceState } from '@/modules/music-practice/service';
import { CHORD_TYPES, type ChordType } from '@/lib/music-chords';
import { respData, respErr } from '@/lib/resp';

const input = z.object({
  root: z.number().int().min(0).max(11),
  type: z.enum(Object.keys(CHORD_TYPES) as [ChordType, ...ChordType[]]),
  inversion: z.number().int().min(0).max(3),
  private: z.boolean().default(false),
});
const headers = { 'Cache-Control': 'no-store' };
export const Route = createFileRoute('/api/music-chords')({
  server: {
    handlers: {
      GET: async () => {
        try {
          return respData(await recentChords(), { headers });
        } catch {
          return respErr('CHORDS_UNAVAILABLE', { status: 503 });
        }
      },
      POST: async ({ request }) => {
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin)
          return respErr('INVALID_ORIGIN', { status: 403 });
        const parsed = input.safeParse(await request.json().catch(() => null));
        if (
          !parsed.success ||
          parsed.data.inversion >=
            CHORD_TYPES[parsed.data.type].intervals.length
        )
          return respErr('INVALID_CHORD', { status: 400 });
        try {
          const session = await getAuth().api.getSession({
            headers: request.headers,
          });
          const premium = session?.user
            ? await isMusicPro(session.user.id)
            : false;
          const preference = session?.user
            ? (await practiceState(`user:${session.user.id}`, premium)).private
            : false;
          const isPrivate = parsed.data.private || preference;
          if (isPrivate && !premium)
            return respErr('PREMIUM_REQUIRED', { status: 403 });
          return respData(await discoverChord(parsed.data, isPrivate), {
            headers,
          });
        } catch {
          return respErr('CHORDS_UNAVAILABLE', { status: 503 });
        }
      },
    },
  },
});
