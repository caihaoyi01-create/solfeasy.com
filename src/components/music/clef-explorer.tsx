import { useEffect, useState } from 'react';

import { noteName, playNotes, stopNotes, type Clef } from '@/lib/music-theory';

import { Keyboard, Staff, type MusicLabels } from './primitives';

export function Explorer({ labels }: { labels: MusicLabels }) {
  const [clef, setClef] = useState<Clef>('treble'),
    [midi, setMidi] = useState(62),
    [error, setError] = useState(false);
  useEffect(() => () => stopNotes(), []);
  return (
    <section
      className="sf-music-tool sf-clef-explorer"
      aria-label={labels.compareClefs}
    >
      <div className="sf-tool-controls">
        <div className="sf-tool-tabs" role="group" aria-label={labels.clef}>
          {(['treble', 'bass'] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={clef === value}
              onClick={() => setClef(value)}
            >
              {labels[value]}
            </button>
          ))}
        </div>
        <span>{noteName(midi)}</span>
      </div>
      <Staff midi={midi} clef={clef} labels={labels} />
      <p>{labels.compareHint}</p>
      <Keyboard
        activeNotes={[midi]}
        onPlay={(value) => {
          setMidi(value);
          void playNotes([value]).catch(() => setError(true));
        }}
        labels={labels}
      />
      {error && <p role="status">{labels.audioError}</p>}
    </section>
  );
}
