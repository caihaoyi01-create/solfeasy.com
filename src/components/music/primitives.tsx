import { useId } from 'react';

import {
  isNatural,
  ledgerPositions,
  noteName,
  staffY,
  type Clef,
} from '@/lib/music-theory';

export type MusicLabels = Record<string, string>;
export interface StaffProps {
  midi: number;
  clef: Clef;
  reveal?: boolean;
  labels: MusicLabels;
}
export function Staff({ midi, clef, reveal = true, labels }: StaffProps) {
  const id = useId(),
    y = staffY(midi, clef),
    accidental = !isNatural(midi);
  const top = Math.min(0, y - 28),
    height = Math.max(220, y + 36) - top;
  const position = (136 - y) / 9;
  const description =
    position < 0
      ? `${labels.belowStaff}: ${-position}`
      : position > 8
        ? `${labels.aboveStaff}: ${position - 8}`
        : position % 2 === 0
          ? `${labels.staffLine}: ${position / 2 + 1}`
          : `${labels.staffSpace}: ${(position + 1) / 2}`;
  return (
    <div className="sf-music-staff">
      <svg viewBox={`0 ${top} 560 ${height}`} role="img" aria-labelledby={id}>
        <title
          id={id}
        >{`${labels[clef]} · ${reveal ? noteName(midi) : `${labels.identify}. ${description}`}`}</title>
        {[64, 82, 100, 118, 136].map((line) => (
          <line
            key={line}
            x1="32"
            y1={line}
            x2="528"
            y2={line}
            className="sf-staff-line"
          />
        ))}
        <text
          x="51"
          y={clef === 'treble' ? 149 : 119}
          className={`sf-clef sf-clef-${clef}`}
        >
          {clef === 'treble' ? '𝄞' : '𝄢'}
        </text>
        {ledgerPositions(midi, clef).map((line) => (
          <line
            key={line}
            x1="280"
            y1={line}
            x2="327"
            y2={line}
            className="sf-staff-line sf-ledger"
          />
        ))}
        {accidental && (
          <text x="268" y={y + 8} fontSize="26" fill="#202225">
            ♯
          </text>
        )}
        <ellipse
          cx="304"
          cy={y}
          rx="14"
          ry="10"
          transform={`rotate(-18 304 ${y})`}
          className="sf-note-head"
        />
        {y >= 100 ? (
          <line
            x1="317"
            y1={y - 3}
            x2="317"
            y2={y - 57}
            className="sf-note-stem"
          />
        ) : (
          <line
            x1="291"
            y1={y + 3}
            x2="291"
            y2={y + 57}
            className="sf-note-stem"
          />
        )}
      </svg>
      <span className="sf-staff-caption">
        {reveal ? noteName(midi) : labels.question}
      </span>
    </div>
  );
}
const SHORTCUTS = [
  'a',
  'w',
  's',
  'e',
  'd',
  'f',
  't',
  'g',
  'y',
  'h',
  'u',
  'j',
  'k',
  'o',
  'l',
  'p',
  ';',
];
export interface KeyboardProps {
  startMidi?: number;
  endMidi?: number;
  activeNotes?: number[];
  onPlay: (midi: number) => void;
  disabled?: boolean;
  labels: MusicLabels;
}
export function Keyboard({
  startMidi = 60,
  endMidi = 72,
  activeNotes = [],
  onPlay,
  disabled,
  labels,
}: KeyboardProps) {
  const keys = Array.from(
    { length: endMidi - startMidi + 1 },
    (_, index) => startMidi + index
  );
  const naturals = keys.filter(isNatural),
    width = naturals.length * 53;
  return (
    <div className="sf-piano-scroll">
      <div
        className="sf-piano"
        style={{ width: `max(100%, ${width}px)` }}
        role="group"
        aria-label={labels.keyboard}
        onKeyDown={(event) => {
          if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.repeat ||
            disabled
          )
            return;
          const offset = SHORTCUTS.indexOf(event.key.toLowerCase());
          if (offset >= 0 && offset < keys.length) {
            event.preventDefault();
            onPlay(keys[offset]);
          }
        }}
      >
        {keys.map((midi, offset) => {
          const black = !isNatural(midi),
            whiteIndex = keys.slice(0, offset).filter(isNatural).length;
          const shortcut = SHORTCUTS[offset];
          return (
            <button
              key={midi}
              type="button"
              disabled={disabled}
              aria-label={`${noteName(midi)}${shortcut ? ` (${shortcut.toUpperCase()})` : ''}`}
              aria-pressed={activeNotes.includes(midi)}
              className={`sf-piano-key ${black ? 'sf-black-key' : 'sf-white-key'} ${activeNotes.includes(midi) ? 'sf-key-active' : ''}`}
              style={
                black
                  ? {
                      left: `${(whiteIndex / naturals.length) * 100}%`,
                      width: `${61 / naturals.length}%`,
                    }
                  : { width: `${100 / naturals.length}%` }
              }
              onClick={() => onPlay(midi)}
            >
              <span>{noteName(midi)}</span>
              <kbd>{shortcut?.toUpperCase()}</kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
