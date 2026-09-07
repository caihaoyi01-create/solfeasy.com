export const CHORD_ROOTS = [
  'C',
  'D♭',
  'D',
  'E♭',
  'E',
  'F',
  'F♯',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const;
export const CHORD_TYPES = {
  major: { intervals: [0, 4, 7], degrees: [0, 2, 4], suffix: '' },
  minor: { intervals: [0, 3, 7], degrees: [0, 2, 4], suffix: 'm' },
  seventh: { intervals: [0, 4, 7, 10], degrees: [0, 2, 4, 6], suffix: '7' },
  major7: { intervals: [0, 4, 7, 11], degrees: [0, 2, 4, 6], suffix: 'maj7' },
  minor7: { intervals: [0, 3, 7, 10], degrees: [0, 2, 4, 6], suffix: 'm7' },
  dim: { intervals: [0, 3, 6], degrees: [0, 2, 4], suffix: 'dim' },
  aug: { intervals: [0, 4, 8], degrees: [0, 2, 4], suffix: 'aug' },
  sus2: { intervals: [0, 2, 7], degrees: [0, 1, 4], suffix: 'sus2' },
  sus4: { intervals: [0, 5, 7], degrees: [0, 3, 4], suffix: 'sus4' },
} as const;
export type ChordType = keyof typeof CHORD_TYPES;
export type ChordSelection = {
  root: number;
  type: ChordType;
  inversion: number;
};
export function resolveChord({ root, type, inversion }: ChordSelection) {
  const definition = CHORD_TYPES[type];
  if (
    !Number.isInteger(root) ||
    root < 0 ||
    root > 11 ||
    !definition ||
    !Number.isInteger(inversion) ||
    inversion < 0 ||
    inversion >= definition.intervals.length
  )
    throw new Error('INVALID_CHORD');
  const notes: number[] = definition.intervals.map(
    (interval) => 60 + root + interval
  );
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const naturals = [0, 2, 4, 5, 7, 9, 11];
  const rootLetter = letters.indexOf(CHORD_ROOTS[root][0]);
  const names = definition.intervals.map((interval, i) => {
    const letter = (rootLetter + definition.degrees[i]) % 7;
    let accidental = (root + interval - naturals[letter] + 12) % 12;
    if (accidental > 6) accidental -= 12;
    return (
      letters[letter] +
      (accidental > 0 ? '♯'.repeat(accidental) : '♭'.repeat(-accidental))
    );
  });
  for (let i = 0; i < inversion; i++) {
    notes.push(notes.shift()! + 12);
    names.push(names.shift()!);
  }
  return {
    notes,
    names,
    name: CHORD_ROOTS[root] + definition.suffix,
    fingers:
      notes.length === 4
        ? '1 – 2 – 3 – 5'
        : inversion === 1
          ? '1 – 2 – 5'
          : '1 – 3 – 5',
  };
}
export const CHORD_PROGRESSIONS: { label: string; chords: ChordSelection[] }[] =
  [
    {
      label: 'C – G – Am – F',
      chords: [
        { root: 0, type: 'major', inversion: 0 },
        { root: 7, type: 'major', inversion: 0 },
        { root: 9, type: 'minor', inversion: 0 },
        { root: 5, type: 'major', inversion: 0 },
      ],
    },
    {
      label: 'G – D – Em – C',
      chords: [
        { root: 7, type: 'major', inversion: 0 },
        { root: 2, type: 'major', inversion: 0 },
        { root: 4, type: 'minor', inversion: 0 },
        { root: 0, type: 'major', inversion: 0 },
      ],
    },
    {
      label: 'Dm7 – G7 – Cmaj7',
      chords: [
        { root: 2, type: 'minor7', inversion: 0 },
        { root: 7, type: 'seventh', inversion: 0 },
        { root: 0, type: 'major7', inversion: 0 },
      ],
    },
    {
      label: 'Am – F – C – G',
      chords: [
        { root: 9, type: 'minor', inversion: 0 },
        { root: 5, type: 'major', inversion: 0 },
        { root: 0, type: 'major', inversion: 0 },
        { root: 7, type: 'major', inversion: 0 },
      ],
    },
  ];
