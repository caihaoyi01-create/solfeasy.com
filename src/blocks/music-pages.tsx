import { NoteTrainer } from '@/components/music';
import { ChordFinder } from '@/components/solfeasy/chord-finder';
import { DiscoverTools } from '@/components/solfeasy/discover';
import { ReadingGuide, ToolEditorial } from '@/components/solfeasy/editorial';
import { EditorialAd } from '@/components/solfeasy/editorial-ad';
import {
  MusicHeading,
  MusicShell,
  type MusicPageKey,
} from '@/components/solfeasy/shell';

export function NotesPage({ page }: { page: 'home' | 'treble' | 'bass' }) {
  return (
    <MusicShell page={page}>
      <MusicHeading page={page} />
      <NoteTrainer
        clef={page === 'bass' ? 'bass' : 'treble'}
        lockedClef={page !== 'home'}
      />
      <DiscoverTools />
      <div className="sf-content-boundary">
        <EditorialAd position="top" />
        <ToolEditorial page={page} />
        <EditorialAd position="bottom" />
      </div>
    </MusicShell>
  );
}
export function ChordsPage() {
  return (
    <MusicShell page="chords">
      <MusicHeading page="chords" />
      <ChordFinder />
      <div className="sf-content-boundary">
        <EditorialAd position="top" />
        <ToolEditorial page="chords" />
        <EditorialAd position="bottom" />
      </div>
    </MusicShell>
  );
}
export function GuidePage() {
  return (
    <MusicShell page="guide">
      <MusicHeading page="guide" />
      <ReadingGuide />
    </MusicShell>
  );
}
