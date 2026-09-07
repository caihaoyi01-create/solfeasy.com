import { tDynamic } from '@/core/i18n/dynamic';

import { Explorer } from './clef-explorer';
import { Trainer, type TrainerProps } from './note-trainer';
import {
  Keyboard,
  Staff,
  type KeyboardProps,
  type StaffProps,
} from './primitives';

import '@/styles/music-tools.css';

const keys = [
  'treble',
  'bass',
  'identify',
  'question',
  'keyboard',
  'trainer',
  'mode',
  'practice',
  'explore',
  'clef',
  'mute',
  'unmute',
  'explorePrompt',
  'practicePrompt',
  'remaining',
  'unlimited',
  'playAny',
  'correct',
  'notQuite',
  'answerIs',
  'selectedNote',
  'limitInline',
  'loading',
  'chooseKey',
  'keyboardHint',
  'score',
  'streak',
  'time',
  'inRow',
  'next',
  'reveal',
  'skip',
  'error',
  'retry',
  'audioError',
  'results',
  'publicNotice',
  'limitLink',
  'proLink',
  'private',
  'anonymous',
  'notesRead',
  'bestStreak',
  'emptyResults',
  'compareClefs',
  'compareHint',
  'staffLine',
  'staffSpace',
  'aboveStaff',
  'belowStaff',
];
function labels() {
  return Object.fromEntries(keys.map((key) => [key, tDynamic(`music.${key}`)]));
}
export function NoteTrainer(props: Omit<TrainerProps, 'labels'>) {
  return <Trainer {...props} labels={labels()} />;
}
export function MusicStaff(props: Omit<StaffProps, 'labels'>) {
  return <Staff {...props} labels={labels()} />;
}
export function PianoKeyboard(props: Omit<KeyboardProps, 'labels'>) {
  return <Keyboard {...props} labels={labels()} />;
}
export function ClefExplorer() {
  return <Explorer labels={labels()} />;
}
export { playNotes, stopNotes, noteName, chordNotes } from '@/lib/music-theory';
