import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  LockKeyhole,
  Music2,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  lessonExercises,
  validateLessonAttempt,
  type MusicLearningStatus,
} from '@/lib/music-learning';
import { noteName, playNotes, stopNotes } from '@/lib/music-theory';
import { currentPathWithQuery } from '@/lib/redirect';
import { MusicStaff, PianoKeyboard } from '@/components/music';

import '@/styles/music-learning.css';

export type LearningCopy = Record<string, string>;

export function useMusicLearning() {
  const { data: session, isPending } = useSession();
  return useQuery({
    queryKey: ['music-learning', session?.user?.id ?? 'anonymous'],
    enabled: !isPending,
    queryFn: () => apiGet<MusicLearningStatus>('/api/music-learning'),
    staleTime: 15000,
  });
}

export function TrialAction({
  copy,
  compact = false,
}: {
  copy: LearningCopy;
  compact?: boolean;
}) {
  const status = useMusicLearning();
  const router = useRouter();
  const queryClient = useQueryClient();
  const resumedIntent = useRef(false);
  const trial = useMutation({
    mutationFn: () => apiPost('/api/music-learning', { action: 'trial' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-learning'] });
      queryClient.invalidateQueries({ queryKey: ['music-practice'] });
    },
  });
  const t = (key: string) => copy[`music.learning.${key}`];
  useEffect(() => {
    if (!status.data?.signedIn || resumedIntent.current) return;
    resumedIntent.current = true;
    try {
      const intent = JSON.parse(
        sessionStorage.getItem('solfeasy.trialIntent') || 'null'
      );
      if (
        !intent ||
        intent.returnTo !== currentPathWithQuery('/piano-lessons/')
      )
        return;
      sessionStorage.removeItem('solfeasy.trialIntent');
      if (
        Date.now() - intent.createdAt < 30 * 60 * 1000 &&
        !status.data.pro &&
        !status.data.trialUsed
      )
        trial.mutate();
    } catch {
      /* Storage may be disabled; the trial button remains available. */
    }
  }, [status.data?.signedIn]);
  return (
    <div className={`sf-trial-action ${compact ? 'sf-trial-compact' : ''}`}>
      {status.data?.pro ? (
        <p className="sf-learning-success">
          <CheckCircle2 size={18} />
          {t('active')}
          {status.data.trialEndsAt && !status.data.subscriptionActive && (
            <span>
              {' '}
              · {t('ends')}{' '}
              {new Date(status.data.trialEndsAt).toLocaleDateString(
                copy.locale === 'zh' ? 'zh-CN' : 'en-US'
              )}
            </span>
          )}
        </p>
      ) : status.data?.trialUsed ? (
        <>
          <p>{t('expired')}</p>
          <Link className="sf-learning-button" href="/pricing/">
            {t('plans')}
            <ArrowRight size={16} />
          </Link>
        </>
      ) : (
        <>
          <button
            className="sf-learning-button sf-learning-primary"
            disabled={status.isPending || status.isError || trial.isPending}
            onClick={() => {
              if (!status.data?.signedIn) {
                const returnTo = currentPathWithQuery('/piano-lessons/');
                try {
                  sessionStorage.setItem(
                    'solfeasy.trialIntent',
                    JSON.stringify({ returnTo, createdAt: Date.now() })
                  );
                } catch {
                  /* Can still sign in and activate manually. */
                }
                router.push(
                  `/sign-up?callbackUrl=${encodeURIComponent(returnTo)}`
                );
              } else trial.mutate();
            }}
          >
            {trial.isPending ? t('starting') : t('trial')}
            <ArrowRight size={16} />
          </button>
          {!compact && (
            <span className="sf-learning-muted">{t('trialNote')}</span>
          )}
        </>
      )}
      {status.isError && (
        <p role="alert" className="sf-learning-error">
          {status.error.message}{' '}
          <button onClick={() => status.refetch()}>{t('retry')}</button>
        </p>
      )}
      {trial.isError && (
        <p role="alert" className="sf-learning-error">
          {trial.error.message}{' '}
          <button onClick={() => trial.mutate()}>{t('retry')}</button>
        </p>
      )}
    </div>
  );
}

export function LessonsContent({ copy }: { copy: LearningCopy }) {
  const status = useMusicLearning();
  const { data: session } = useSession();
  const [selected, setSelected] = useState(0);
  const t = (key: string) => copy[`music.learning.${key}`];
  const completed = status.data?.progress ?? [];
  return (
    <div className="sf-learning">
      <TrialAction copy={copy} />
      <section className="sf-course-hero">
        <div>
          <span className="sf-learning-eyebrow">{t('courseLabel')}</span>
          <h2>{t('journey')}</h2>
          <p>{t('intro')}</p>
          <div className="sf-course-meta">
            <Music2 size={17} />
            {t('courseMeta')}
          </div>
        </div>
        <div className="sf-course-art" aria-hidden="true">
          <span>♪</span>
          <i />
          <i />
          <i />
          <i />
          <i />
          <b>01 — 04</b>
        </div>
      </section>
      <div className="sf-course-heading">
        <div>
          <h2>{t('courseTitle')}</h2>
          <p className="sf-learning-muted">
            {completed.length
              ? `${completed.length} / 4 ${t('progress')}`
              : t('emptyProgress')}
          </p>
        </div>
        <progress aria-label={t('progress')} value={completed.length} max={4} />
      </div>
      <div className="sf-course-layout">
        <div
          className="sf-course-list"
          role="tablist"
          aria-label={t('courseTitle')}
        >
          {lessonExercises.map((lesson, i) => (
            <button
              key={lesson.id}
              type="button"
              role="tab"
              id={`lesson-tab-${lesson.id}`}
              aria-controls={`lesson-panel-${lesson.id}`}
              aria-selected={selected === i}
              onClick={() => setSelected(i)}
              className={`sf-course-card ${selected === i ? 'is-selected' : ''}`}
            >
              <span className="sf-course-number">
                {completed.includes(lesson.id) ? (
                  <Check size={21} />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <span>
                <strong>{t(`lesson${i + 1}.title`)}</strong>
                <small>{t(`lesson${i + 1}.desc`)}</small>
                <em>
                  {completed.includes(lesson.id)
                    ? t('complete')
                    : lesson.premium
                      ? t('pro')
                      : t('free')}
                </em>
              </span>
              {lesson.premium && !status.data?.pro ? (
                <LockKeyhole size={15} />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          ))}
        </div>
        <section
          key={`${selected}:${session?.user?.id ?? 'anonymous'}`}
          className="sf-lesson-panel"
          id={`lesson-panel-${lessonExercises[selected].id}`}
          role="tabpanel"
          aria-labelledby={`lesson-tab-${lessonExercises[selected].id}`}
        >
          <span className="sf-learning-eyebrow">
            {String(selected + 1).padStart(2, '0')} / 04
          </span>
          <h2>{t(`lesson${selected + 1}.title`)}</h2>
          <p>{t(`lesson${selected + 1}.body`)}</p>
          <aside className="sf-lesson-tip">
            {t(`lesson${selected + 1}.tip`)}
          </aside>
          {lessonExercises[selected].premium && !status.data?.pro ? (
            <div className="sf-lesson-lock">
              <LockKeyhole size={24} />
              <p>{t('locked')}</p>
              <TrialAction copy={copy} compact />
            </div>
          ) : (
            <LessonExercise
              copy={copy}
              index={selected}
              signedIn={Boolean(status.data?.signedIn)}
              saved={completed.includes(lessonExercises[selected].id)}
            />
          )}
        </section>
      </div>
      <p className="sf-learning-footnote">{copy['music.pricing.noAds']}</p>
    </div>
  );
}

function LessonExercise({
  copy,
  index,
  signedIn,
  saved,
}: {
  copy: LearningCopy;
  index: number;
  signedIn: boolean;
  saved: boolean;
}) {
  const lesson = lessonExercises[index];
  const [played, setPlayed] = useState<number[]>([]);
  const [times, setTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [audioError, setAudioError] = useState(false);
  const [listening, setListening] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = (key: string) => copy[`music.learning.${key}`];
  const intervals = times.slice(1).map((time, i) => time - times[i]);
  const done = validateLessonAttempt(lesson.id, played, intervals);
  const next = lesson.notes[Math.min(played.length, lesson.notes.length - 1)];
  const save = useMutation({
    mutationFn: () =>
      apiPost('/api/music-learning', {
        action: 'complete',
        lessonId: lesson.id,
        notes: played,
        intervals,
      }),
    onSuccess: () => {
      try {
        sessionStorage.removeItem('solfeasy.lessonDraft');
      } catch {
        /* Server save is authoritative. */
      }
      queryClient.invalidateQueries({ queryKey: ['music-learning'] });
    },
  });
  useEffect(() => {
    try {
      const draft = JSON.parse(
        sessionStorage.getItem('solfeasy.lessonDraft') || 'null'
      );
      if (
        !draft ||
        draft.lessonId !== lesson.id ||
        Date.now() - draft.createdAt > 30 * 60 * 1000
      )
        return;
      if (
        !Array.isArray(draft.notes) ||
        !Array.isArray(draft.times) ||
        draft.notes.length > 32 ||
        draft.times.length !== draft.notes.length ||
        !draft.times.every(
          (time: unknown) => typeof time === 'number' && Number.isFinite(time)
        )
      )
        return;
      const intervals = draft.times
        .slice(1)
        .map((time: number, i: number) => time - draft.times[i]);
      if (validateLessonAttempt(lesson.id, draft.notes, intervals)) {
        setPlayed(draft.notes);
        setTimes(draft.times);
        setFeedback(t('done'));
      }
    } catch {
      /* A missing or malformed local draft never marks a lesson saved. */
    }
  }, [lesson.id]);
  function stopExample() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    stopNotes();
    setListening(false);
  }
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopNotes();
    },
    []
  );
  function restart() {
    stopExample();
    setPlayed([]);
    setTimes([]);
    setFeedback('');
    save.reset();
  }
  function listen() {
    if (listening) {
      stopExample();
      return;
    }
    setListening(true);
    setAudioError(false);
    let elapsed = 0;
    lesson.notes.forEach((note, i) => {
      const play = () => {
        playNotes([note], lesson.beats[i] * 0.65).catch(() =>
          setAudioError(true)
        );
      };
      if (i === 0) play();
      else timers.current.push(setTimeout(play, elapsed));
      elapsed += lesson.beats[i] * 750;
    });
    timers.current.push(setTimeout(() => setListening(false), elapsed));
  }
  function onPlay(midi: number) {
    playNotes([midi]).catch(() => setAudioError(true));
    if (played.length === lesson.notes.length || listening) return;
    if (midi !== next) {
      setFeedback(t('wrong'));
      return;
    }
    const notes = [...played, midi],
      newTimes = [...times, performance.now()];
    setPlayed(notes);
    setTimes(newTimes);
    setFeedback(
      notes.length === lesson.notes.length
        ? validateLessonAttempt(
            lesson.id,
            notes,
            newTimes.slice(1).map((time, i) => time - newTimes[i])
          )
          ? t('done')
          : t('timing')
        : t('correct')
    );
  }
  return (
    <div className="sf-lesson-exercise">
      <div className="sf-lesson-tools">
        <button className="sf-learning-button" onClick={listen}>
          {listening ? <Square size={15} /> : <Play size={15} />}
          {listening ? t('stop') : t('listen')}
        </button>
        <button className="sf-learning-button" onClick={restart}>
          <RotateCcw size={15} />
          {t('restart')}
        </button>
      </div>
      <p className="sf-learning-muted">
        {t('play')}
        {lesson.id === 'steady-rhythm' && ' · 80 BPM'}
      </p>
      <div className="sf-lesson-sequence">
        {lesson.notes.map((note, i) => (
          <span
            key={i}
            className={
              i < played.length
                ? 'is-played'
                : i === played.length
                  ? 'is-next'
                  : ''
            }
          >
            {noteName(note)}
            {i < played.length && <Check size={12} />}
          </span>
        ))}
      </div>
      <MusicStaff midi={next} clef={index === 3 ? 'bass' : 'treble'} reveal />
      <PianoKeyboard
        startMidi={index === 3 ? 48 : 60}
        endMidi={index === 3 ? 60 : 72}
        activeNotes={done ? [] : [next]}
        onPlay={onPlay}
        disabled={listening}
      />
      <p className="sf-lesson-feedback" aria-live="polite">
        {feedback || `${t('next')}: ${noteName(next)}`}
      </p>
      {audioError && (
        <p role="alert" className="sf-learning-error">
          {t('audioError')}
        </p>
      )}
      {done && (
        <div className="sf-lesson-save">
          {saved || save.isSuccess ? (
            <p className="sf-learning-success">
              <CheckCircle2 size={18} />
              {t('saved')}
            </p>
          ) : (
            <button
              className="sf-learning-button sf-learning-primary"
              disabled={save.isPending}
              onClick={() => {
                if (signedIn) save.mutate();
                else {
                  try {
                    sessionStorage.setItem(
                      'solfeasy.lessonDraft',
                      JSON.stringify({
                        lessonId: lesson.id,
                        notes: played,
                        times,
                        createdAt: Date.now(),
                      })
                    );
                  } catch {
                    /* User can repeat the free exercise after login. */
                  }
                  router.push(
                    `/sign-in?callbackUrl=${encodeURIComponent(currentPathWithQuery('/piano-lessons/'))}`
                  );
                }
              }}
            >
              {save.isPending
                ? t('saving')
                : signedIn
                  ? t('save')
                  : t('signSave')}
              <Check size={16} />
            </button>
          )}
        </div>
      )}
      {save.isError && (
        <p role="alert" className="sf-learning-error">
          {save.error.message}{' '}
          <button onClick={() => save.mutate()}>{t('retry')}</button>
        </p>
      )}
    </div>
  );
}
