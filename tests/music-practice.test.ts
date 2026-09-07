import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  chordNotes,
  diatonicPosition,
  ledgerPositions,
  naturalNotes,
  noteName,
  staffY,
} from '../src/lib/music-theory';

test('MIDI names preserve octaves and chromatic notes', () => {
  assert.equal(noteName(60), 'C4');
  assert.equal(noteName(36), 'C2');
  assert.equal(noteName(61), 'C♯4');
  assert.deepEqual(naturalNotes(60, 72), [60, 62, 64, 65, 67, 69, 71, 72]);
});
test('five staff lines and ledger lines represent the correct pitches in both clefs', () => {
  assert.deepEqual(
    [64, 67, 71, 74, 77].map((note) => staffY(note, 'treble')),
    [136, 118, 100, 82, 64]
  );
  assert.deepEqual(
    [43, 47, 50, 53, 57].map((note) => staffY(note, 'bass')),
    [136, 118, 100, 82, 64]
  );
  assert.deepEqual(ledgerPositions(60, 'treble'), [154]);
  assert.deepEqual(ledgerPositions(62, 'treble'), []);
  assert.deepEqual(ledgerPositions(60, 'bass'), [46]);
  assert.equal(diatonicPosition(61), diatonicPosition(60));
});
test('chord qualities and inversions retain ascending notes and the correct pitches', () => {
  assert.deepEqual(chordNotes(60, 'major'), [60, 64, 67]);
  assert.deepEqual(chordNotes(60, 'minor', 1), [63, 67, 72]);
  assert.deepEqual(chordNotes(60, '7th', 2), [67, 70, 72, 76]);
  assert.deepEqual(chordNotes(60, 'sus4'), [60, 65, 67]);
});
