import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHORD_ROOTS,
  CHORD_TYPES,
  resolveChord,
  type ChordType,
} from '../src/lib/music-chords';

test('chords retain correct musical spelling and inversions', () => {
  assert.deepEqual(
    resolveChord({ root: 0, type: 'minor', inversion: 0 }).names,
    ['C', 'E♭', 'G']
  );
  assert.deepEqual(
    resolveChord({ root: 6, type: 'major', inversion: 0 }).names,
    ['F♯', 'A♯', 'C♯']
  );
  assert.deepEqual(
    resolveChord({ root: 0, type: 'major', inversion: 1 }).notes,
    [64, 67, 72]
  );
  assert.deepEqual(
    resolveChord({ root: 10, type: 'dim', inversion: 0 }).names,
    ['B♭', 'D♭', 'F♭']
  );
});
test('all root/type/inversion combinations fit the keyboard and ascend', () => {
  for (let root = 0; root < CHORD_ROOTS.length; root++)
    for (const type of Object.keys(CHORD_TYPES) as ChordType[])
      for (
        let inversion = 0;
        inversion < CHORD_TYPES[type].intervals.length;
        inversion++
      ) {
        const { notes, names } = resolveChord({ root, type, inversion });
        assert.equal(notes.length, names.length);
        assert.ok(
          notes.every(
            (note, i) =>
              note >= 60 && note <= 95 && (i === 0 || note > notes[i - 1])
          )
        );
      }
});
test('invalid chord inputs are rejected', () => {
  assert.throws(() => resolveChord({ root: 12, type: 'major', inversion: 0 }));
  assert.throws(() => resolveChord({ root: 0, type: 'major', inversion: 3 }));
});
