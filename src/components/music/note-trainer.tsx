import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Eye,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import { noteName, playNotes, stopNotes, type Clef } from '@/lib/music-theory';

import { Keyboard, Staff, type MusicLabels } from './primitives';

interface State {
  attempts: number;
  correct: number;
  streak: number;
  best: number;
  private: boolean;
  premium: boolean;
  remaining: number | null;
  limit: number;
  resetsAt: string;
}
interface Question {
  id: string;
  midi: number;
  clef: Clef;
}
interface Grade {
  correct: boolean;
  answer: number;
  repeated: boolean;
  state: State;
}
interface Activity {
  correct: number;
  attempts: number;
  best: number;
}
export interface TrainerProps {
  clef?: Clef;
  lockedClef?: boolean;
  compact?: boolean;
  labels: MusicLabels;
}

export function Trainer({
  clef: initialClef = 'treble',
  lockedClef = false,
  compact = false,
  labels,
}: TrainerProps) {
  const [clef, setClef] = useState<Clef>(initialClef),
    [mode, setMode] = useState<'practice' | 'explore'>('practice');
  const [explored, setExplored] = useState(initialClef === 'treble' ? 60 : 48),
    [muted, setMuted] = useState(false);
  const [question, setQuestion] = useState<Question>(),
    [grade, setGrade] = useState<Grade>(),
    [active, setActive] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0),
    [soundError, setSoundError] = useState(false);
  const mountedAt = useRef(Date.now()),
    gradeLock = useRef(false),
    questionLock = useRef(false);
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ['music-practice'],
    queryFn: () =>
      apiGet<{ state: State; activity: Activity[] }>('/api/music-practice'),
    staleTime: 0,
    refetchInterval: 60000,
    retry: 1,
  });
  const questionMutation = useMutation({
    mutationFn: (nextClef: Clef) =>
      apiPost<Question>('/api/music-practice', {
        action: 'question',
        clef: nextClef,
      }),
    onSuccess: (next) => {
      setQuestion(next);
      setGrade(undefined);
      setActive([]);
      gradeLock.current = false;
    },
    onSettled: () => {
      questionLock.current = false;
    },
  });
  const gradeMutation = useMutation({
    mutationFn: (answer: number | null) =>
      apiPost<Grade>('/api/music-practice', {
        action: 'grade',
        questionId: question!.id,
        answer,
      }),
    onSuccess: (result) => {
      setGrade(result);
      client.setQueryData(
        ['music-practice'],
        (previous: { state: State; activity: Activity[] } | undefined) => ({
          state: result.state,
          activity: previous?.activity ?? [],
        })
      );
      void client.invalidateQueries({ queryKey: ['music-practice'] });
    },
    onError: () => {
      gradeLock.current = false;
      void client.invalidateQueries({ queryKey: ['music-practice'] });
    },
  });
  const privacyMutation = useMutation({
    mutationFn: (privateResult: boolean) =>
      apiPost<State>('/api/music-practice', {
        action: 'privacy',
        private: privateResult,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['music-practice'] });
    },
  });
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - mountedAt.current) / 1000)),
      1000
    );
    return () => {
      window.clearInterval(timer);
      stopNotes();
    };
  }, []);
  useEffect(() => {
    if (
      session.isSuccess &&
      !question &&
      !questionLock.current &&
      !questionMutation.isPending &&
      !questionMutation.isError
    ) {
      questionLock.current = true;
      questionMutation.mutate(clef);
    }
  }, [
    session.isSuccess,
    question,
    clef,
    questionMutation.isPending,
    questionMutation.isError,
  ]);
  const state = session.data?.state,
    atLimit = state?.remaining === 0,
    busy = gradeMutation.isPending || questionMutation.isPending;
  const midi =
    mode === 'explore'
      ? explored
      : (question?.midi ?? (clef === 'treble' ? 67 : 48));
  function sound(notes: number[]) {
    if (!muted) void playNotes(notes).catch(() => setSoundError(true));
  }
  function play(midi: number) {
    setActive([midi]);
    sound([midi]);
    if (mode === 'explore') {
      setExplored(midi);
      return;
    }
    if (question && !grade && !busy && !atLimit && !gradeLock.current) {
      gradeLock.current = true;
      gradeMutation.mutate(midi);
    }
  }
  function changeClef(next: Clef) {
    if (next === clef || busy || questionLock.current) return;
    setClef(next);
    setExplored(next === 'treble' ? 60 : 48);
    setGrade(undefined);
    setQuestion(undefined);
    gradeMutation.reset();
    questionMutation.reset();
  }
  function next() {
    if (questionLock.current) return;
    questionLock.current = true;
    gradeMutation.reset();
    questionMutation.mutate(clef);
  }
  const error =
    session.isError || questionMutation.isError || gradeMutation.isError;
  return (
    <div className={`sf-trainer-wrap ${compact ? 'sf-trainer-compact' : ''}`}>
      <section className="sf-music-tool" aria-label={labels.trainer}>
        <div className="sf-tool-controls">
          <div className="sf-tool-tabs" role="group" aria-label={labels.mode}>
            {(['practice', 'explore'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {labels[value]}
              </button>
            ))}
          </div>
          <div className="sf-clef-controls">
            {!lockedClef && (
              <div
                className="sf-tool-tabs"
                role="group"
                aria-label={labels.clef}
              >
                {(['treble', 'bass'] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={clef === value}
                    disabled={busy}
                    onClick={() => changeClef(value)}
                  >
                    {labels[value]}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="sf-sound-button"
              aria-label={muted ? labels.unmute : labels.mute}
              aria-pressed={muted}
              onClick={() => {
                setMuted(!muted);
                if (!muted) stopNotes();
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
        <div className="sf-tool-prompt">
          <span className="sf-live-dot" />
          {mode === 'explore' ? labels.explorePrompt : labels.practicePrompt}
          <small>
            {mode === 'practice' && state
              ? state.premium
                ? labels.unlimited
                : `${state.remaining}/${state.limit} ${labels.remaining}`
              : labels.playAny}
          </small>
        </div>
        <div className="sf-staff-stage">
          <Staff
            midi={midi}
            clef={clef}
            reveal={mode === 'explore' || !!grade}
            labels={labels}
          />
        </div>
        <div
          className={`sf-answer-feedback ${grade ? (grade.correct ? 'sf-feedback-correct' : 'sf-feedback-wrong') : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {mode === 'explore' ? (
            <>
              {labels.selectedNote} <strong>{noteName(explored)}</strong>
            </>
          ) : grade ? (
            <>
              {grade.correct && <Check size={16} />}
              <strong>
                {grade.correct ? labels.correct : labels.notQuite}
              </strong>{' '}
              {labels.answerIs} {noteName(grade.answer)}
            </>
          ) : atLimit ? (
            labels.limitInline
          ) : question ? (
            labels.chooseKey
          ) : (
            labels.loading
          )}
        </div>
        <Keyboard
          startMidi={clef === 'treble' ? 60 : 36}
          endMidi={clef === 'treble' ? 72 : 60}
          activeNotes={active}
          onPlay={play}
          disabled={
            mode === 'practice' && (!question || busy || !!grade || !!atLimit)
          }
          labels={labels}
        />
        <div className="sf-keyboard-help">{labels.keyboardHint}</div>
        <div className="sf-tool-bottom">
          <div className="sf-practice-stats">
            <span>
              <small>{labels.score}</small>
              <strong>
                {state?.correct ?? 0}
                <em> / {state?.attempts ?? 0}</em>
              </strong>
            </span>
            <span>
              <small>{labels.streak}</small>
              <strong>
                {state?.streak ?? 0}
                <em> {labels.inRow}</em>
              </strong>
            </span>
            <span>
              <small>{labels.time}</small>
              <strong>
                {Math.floor(elapsed / 60)}:
                {String(elapsed % 60).padStart(2, '0')}
              </strong>
            </span>
          </div>
          <div className="sf-tool-actions">
            {mode === 'practice' && (
              <>
                {grade ? (
                  <button
                    type="button"
                    className="sf-next-note"
                    disabled={busy || atLimit}
                    onClick={next}
                  >
                    {labels.next}
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!question || busy || atLimit}
                      onClick={() => {
                        if (!gradeLock.current) {
                          gradeLock.current = true;
                          gradeMutation.mutate(null);
                        }
                      }}
                    >
                      <Eye size={15} />
                      {labels.reveal}
                    </button>
                    <button
                      type="button"
                      disabled={!question || busy || atLimit}
                      onClick={() => {
                        if (!gradeLock.current) {
                          gradeLock.current = true;
                          gradeMutation.mutate(null);
                        }
                      }}
                    >
                      <RotateCcw size={15} />
                      {labels.skip}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="sf-tool-error" role="alert">
            {gradeMutation.error?.message === 'DAILY_LIMIT'
              ? labels.limitInline
              : labels.error}
            <button
              type="button"
              onClick={() => {
                const expired =
                  gradeMutation.error?.message === 'QUESTION_EXPIRED';
                gradeMutation.reset();
                void session.refetch();
                if (
                  (!question || expired || questionMutation.isError) &&
                  !questionLock.current
                ) {
                  setQuestion(undefined);
                  setGrade(undefined);
                  questionLock.current = true;
                  questionMutation.reset();
                  questionMutation.mutate(clef);
                }
              }}
            >
              {labels.retry}
            </button>
          </div>
        )}
        {soundError && (
          <p className="sf-tool-error" role="status">
            {labels.audioError}
          </p>
        )}
      </section>
      {!compact && (
        <section className="sf-practice-results" aria-label={labels.results}>
          <div className="sf-results-heading">
            <div>
              <h2>{labels.results}</h2>
              <p>{labels.publicNotice}</p>
            </div>
            <Link href="/piano-lessons/">
              {atLimit ? labels.limitLink : labels.proLink}{' '}
              <ArrowRight size={14} />
            </Link>
          </div>
          {state?.premium && (
            <label className="sf-privacy-option">
              <input
                type="checkbox"
                checked={state.private}
                disabled={privacyMutation.isPending}
                onChange={(event) =>
                  privacyMutation.mutate(event.target.checked)
                }
              />
              {labels.private}
            </label>
          )}
          {privacyMutation.isError && <p role="alert">{labels.error}</p>}
          <div className="sf-result-list">
            {session.data?.activity.length ? (
              session.data.activity.map((item, index) => (
                <article key={index}>
                  <span className="sf-result-icon">♪</span>
                  <div>
                    <strong>{labels.anonymous}</strong>
                    <span>
                      {item.correct}/{item.attempts} {labels.notesRead}
                    </span>
                  </div>
                  <span className="sf-result-streak">
                    {item.best} {labels.bestStreak}
                  </span>
                </article>
              ))
            ) : (
              <p className="sf-empty-results">{labels.emptyResults}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
