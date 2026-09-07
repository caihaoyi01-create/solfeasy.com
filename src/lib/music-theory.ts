export type Clef = 'treble' | 'bass';
export const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
];
export function noteName(midi: number) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
export function isNatural(midi: number) {
  return [0, 2, 4, 5, 7, 9, 11].includes(midi % 12);
}
export function naturalNotes(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start).filter(
    isNatural
  );
}
export function diatonicPosition(midi: number) {
  return (
    Math.floor(midi / 12) * 7 + [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][midi % 12]
  );
}
export function staffY(midi: number, clef: Clef) {
  return (
    136 -
    (diatonicPosition(midi) - diatonicPosition(clef === 'treble' ? 64 : 43)) * 9
  );
}
export function ledgerPositions(midi: number, clef: Clef) {
  const y = staffY(midi, clef),
    lines: number[] = [];
  for (let p = 154; p <= y; p += 18) lines.push(p);
  for (let p = 46; p >= y; p -= 18) lines.push(p);
  return lines;
}
export const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7th': [0, 4, 7, 10],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
};
export function chordNotes(rootMidi: number, type: string, inversion = 0) {
  const notes = (
    CHORD_INTERVALS[type.toLowerCase()] ?? CHORD_INTERVALS.major
  ).map((n) => n + rootMidi);
  for (let i = 0; i < Math.max(0, inversion) % notes.length; i++)
    notes.push(notes.shift()! + 12);
  return notes;
}
let audio: AudioContext | undefined;
let audioGeneration = 0;
const playing = new Set<OscillatorNode>();
export async function playNotes(midiNumbers: number[], duration = 0.65) {
  if (typeof window === 'undefined') return;
  audio ??= new AudioContext();
  const requestedGeneration = audioGeneration;
  await audio.resume();
  if (requestedGeneration !== audioGeneration) return;
  const now = audio.currentTime;
  midiNumbers.forEach((midi) => {
    const oscillator = audio!.createOscillator(),
      gain = audio!.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(
      0.18 / Math.max(1, midiNumbers.length),
      now + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio!.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    playing.add(oscillator);
    oscillator.onended = () => {
      playing.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
  });
}
export function stopNotes() {
  audioGeneration++;
  playing.forEach((node) => {
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
  });
  playing.clear();
}
