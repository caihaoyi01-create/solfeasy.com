import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Play, Square, Volume2 } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { tDynamic as t } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  CHORD_PROGRESSIONS,
  CHORD_ROOTS,
  CHORD_TYPES,
  resolveChord,
  type ChordSelection,
  type ChordType,
} from '@/lib/music-chords';
import { PianoKeyboard, playNotes, stopNotes } from '@/components/music';

export function ChordFinder() {
  const [root, setRoot] = useState(0),
    [type, setType] = useState<ChordType>('major');
  const [selection, setSelection] = useState<ChordSelection>({
    root: 0,
    type: 'major',
    inversion: 0,
  });
  const [active, setActive] = useState<number[]>([]),
    [playing, setPlaying] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    run = useRef(0),
    queryClient = useQueryClient();
  const auth = useSession();
  const result = resolveChord(selection);
  const activity = useQuery({
    queryKey: ['music-chords'],
    queryFn: () => apiGet<ChordSelection[]>('/api/music-chords'),
  });
  const privacy = useQuery({
    queryKey: ['music-practice', auth.data?.user?.id ?? 'anonymous'],
    enabled: !auth.isPending,
    queryFn: () =>
      apiGet<{ state: { premium: boolean; private: boolean } }>(
        '/api/music-practice'
      ),
  });
  const privacyChange = useMutation({
    mutationFn: (value: boolean) =>
      apiPost('/api/music-practice', { action: 'privacy', private: value }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['music-practice'] }),
  });
  const share = useMutation({
    mutationFn: (chord: ChordSelection) =>
      apiPost<ChordSelection[]>('/api/music-chords', {
        ...chord,
        private: privacy.data?.state.private ?? false,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['music-chords'] }),
  });
  function stop() {
    run.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    stopNotes();
    setPlaying(null);
    setActive([]);
  }
  useEffect(
    () => () => {
      run.current++;
      timers.current.forEach(clearTimeout);
      stopNotes();
    },
    []
  );
  async function sound(notes: number[], duration = 0.65) {
    const version = run.current;
    setAudioError(false);
    setActive(notes);
    try {
      await playNotes(notes, duration);
    } catch {
      if (version === run.current) setAudioError(true);
    }
    if (version !== run.current) return;
    timers.current.push(
      setTimeout(() => {
        if (version === run.current) setActive([]);
      }, duration * 1000)
    );
  }
  function find(chord: ChordSelection) {
    stop();
    setSelection(chord);
    setRoot(chord.root);
    setType(chord.type);
    share.mutate(chord);
  }
  function progression(index: number) {
    if (playing === index) {
      stop();
      return;
    }
    stop();
    setPlaying(index);
    CHORD_PROGRESSIONS[index].chords.forEach((chord, i) =>
      timers.current.push(
        setTimeout(() => {
          setSelection(chord);
          setRoot(chord.root);
          setType(chord.type);
          void sound(resolveChord(chord).notes, 0.65);
        }, i * 850)
      )
    );
    timers.current.push(
      setTimeout(
        () => setPlaying(null),
        CHORD_PROGRESSIONS[index].chords.length * 850
      )
    );
  }
  return (
    <>
      <section className="sf-chord-tool" aria-label={t('sf.chords.h1')}>
        <div className="sf-chord-controls">
          <label>
            {t('sf.chord.root')}
            <select
              aria-label={t('sf.chord.root')}
              value={root}
              onChange={(e) => {
                stop();
                setRoot(Number(e.target.value));
              }}
            >
              {CHORD_ROOTS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('sf.chord.type')}
            <select
              aria-label={t('sf.chord.type')}
              value={type}
              onChange={(e) => {
                stop();
                setType(e.target.value as ChordType);
              }}
            >
              {Object.keys(CHORD_TYPES).map((key) => (
                <option key={key} value={key}>
                  {t(`sf.chord.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="sf-btn sf-btn-primary"
            onClick={() => find({ root, type, inversion: 0 })}
          >
            {t('sf.chord.find')}
            <ArrowRight />
          </button>
        </div>
        <div className="sf-chord-result">
          <div>
            <div className="sf-chord-name">
              <strong>{result.name}</strong>
              <span>{result.names.join(' – ')}</span>
            </div>
            <p>
              {t('sf.chord.fingers')} {result.fingers}
            </p>
            <p>{t('sf.chord.finger_hint')}</p>
          </div>
          <button
            className="sf-btn"
            onClick={() => {
              stop();
              void sound(result.notes);
            }}
          >
            <Volume2 />
            {t('sf.chord.play')}
          </button>
        </div>
        <PianoKeyboard
          startMidi={60}
          endMidi={95}
          activeNotes={active.length ? active : result.notes}
          onPlay={(midi) => {
            stop();
            void sound([midi]);
          }}
        />
        <div
          className="sf-inversions"
          role="group"
          aria-label={t('sf.chord.inversions')}
        >
          {Array.from(
            { length: CHORD_TYPES[selection.type].intervals.length },
            (_, inversion) => (
              <button
                key={inversion}
                aria-pressed={selection.inversion === inversion}
                onClick={() => find({ ...selection, inversion })}
              >
                {t(
                  inversion
                    ? `sf.chord.inversion${inversion}`
                    : 'sf.chord.root_position'
                )}
              </button>
            )
          )}
        </div>
        <div className="sf-chord-status" role="status">
          {audioError ? t('sf.chord.audio_error') : t('sf.chord.listen_hint')}
        </div>
      </section>
      <section>
        <div className="sf-section-title">
          <h2>{t('sf.chord.recent')}</h2>
          <Link href="/pricing/">{t('sf.chord.pro')}</Link>
        </div>
        <div className="sf-recent-chords">
          {activity.data?.map((chord) => (
            <button
              key={`${chord.root}:${chord.type}:${chord.inversion}`}
              onClick={() => find(chord)}
            >
              {resolveChord(chord).name} · {resolveChord(chord).names.join('–')}
            </button>
          ))}
        </div>
        {!activity.data?.length && !activity.isPending && (
          <p className="sf-results-foot">{t('sf.chord.recent_empty')}</p>
        )}
        {activity.isPending && (
          <p className="sf-results-foot" role="status">
            {t('sf.chord.loading')}
          </p>
        )}
        {(activity.isError || share.isError || privacyChange.isError) && (
          <p role="alert" className="sf-results-foot">
            {t(
              share.error?.message === 'PREMIUM_REQUIRED'
                ? 'sf.chord.private_expired'
                : 'sf.chord.share_error'
            )}{' '}
            {share.error?.message !== 'PREMIUM_REQUIRED' && (
              <button
                className="sf-btn"
                onClick={() =>
                  privacyChange.isError
                    ? privacyChange.mutate(privacyChange.variables ?? false)
                    : share.isError
                      ? share.mutate(selection)
                      : void activity.refetch()
                }
              >
                {t('sf.chord.retry')}
              </button>
            )}
          </p>
        )}
        <p className="sf-results-foot">{t('sf.chord.private')}</p>
        {privacy.data?.state.premium && (
          <label className="sf-results-foot">
            <input
              type="checkbox"
              disabled={privacyChange.isPending}
              checked={privacy.data.state.private}
              onChange={(e) => privacyChange.mutate(e.target.checked)}
            />{' '}
            {t('sf.chord.private_toggle')}
          </label>
        )}
      </section>
      <section aria-labelledby="progressions-heading">
        <div className="sf-section-title">
          <h2 id="progressions-heading">{t('sf.chord.progressions')}</h2>
        </div>
        <div className="sf-progression-list">
          {CHORD_PROGRESSIONS.map((item, index) => (
            <article key={item.label} className="sf-progression">
              <button
                className="sf-play-round"
                onClick={() => progression(index)}
                aria-label={`${t(playing === index ? 'sf.chord.stop' : 'sf.chord.play_progression')}: ${item.label}`}
                aria-pressed={playing === index}
              >
                {playing === index ? <Square /> : <Play />}
              </button>
              <div>
                <h3>{item.label}</h3>
                <p>{t(`sf.chord.progression${index + 1}`)}</p>
              </div>
              <small>
                {playing === index
                  ? t('sf.chord.playing')
                  : t('sf.chord.curated')}
              </small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
