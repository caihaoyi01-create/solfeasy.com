export type ToolPage = 'home' | 'treble' | 'bass' | 'chords';

export const toolSections: Record<ToolPage, string[]> = {
  home: ['start', 'map', 'recognize', 'connect', 'practice'],
  treble: ['landmarks', 'lines', 'ledger', 'patterns', 'practice'],
  bass: ['orientation', 'landmarks', 'register', 'patterns', 'practice'],
  chords: ['formula', 'quality', 'inversions', 'progressions', 'practice'],
};

export const guideSections = [
  'sheet-music',
  'staff-clefs',
  'alphabet',
  'rhythm',
  'time-signatures',
  'rests-dynamics',
  'practice',
  'faq',
] as const;

export const learningLinks = [
  { href: '/', key: 'home' },
  { href: '/treble-clef-notes/', key: 'treble' },
  { href: '/bass-clef-notes/', key: 'bass' },
  { href: '/piano-chords/', key: 'chords' },
  { href: '/how-to-read-music/', key: 'guide' },
  { href: '/piano-lessons/', key: 'lessons' },
] as const;
