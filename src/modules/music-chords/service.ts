import { desc } from 'drizzle-orm';

import { db } from '@/core/db';
import { withMusicWrite } from '@/core/db/music-write-lock';
import {
  resolveChord,
  type ChordSelection,
  type ChordType,
} from '@/lib/music-chords';

import { musicChordDiscovery } from './schema';

export async function discoverChord(
  selection: ChordSelection,
  isPrivate: boolean
) {
  resolveChord(selection);
  if (!isPrivate) {
    const record = {
      ...selection,
      id: `${selection.root}:${selection.type}:${selection.inversion}`,
      updatedAt: Date.now(),
    };
    await withMusicWrite(() =>
      db()
        .insert(musicChordDiscovery)
        .values(record)
        .onConflictDoUpdate({
          target: musicChordDiscovery.id,
          set: { updatedAt: record.updatedAt },
        })
    );
  }
  return recentChords();
}
export async function recentChords(): Promise<ChordSelection[]> {
  const rows: (typeof musicChordDiscovery.$inferSelect)[] = await db()
    .select()
    .from(musicChordDiscovery)
    .orderBy(desc(musicChordDiscovery.updatedAt))
    .limit(8);
  return rows.map((row) => ({
    root: row.root,
    type: row.type as ChordType,
    inversion: row.inversion,
  }));
}
