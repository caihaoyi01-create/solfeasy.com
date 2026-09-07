import { useEffect, useRef, useState } from 'react';

import { tDynamic } from '@/core/i18n/dynamic';
import { playNotes, stopNotes } from '@/lib/music-theory';

import '@/styles/music-rhythm.css';

const copy = (key: string) => tDynamic(`sf.rhythm.${key}`);

export function RhythmPractice() {
  const [bpm, setBpm] = useState(80);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const [taps, setTaps] = useState(0);
  const [consistency, setConsistency] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const previousTap = useRef<number | null>(null);
  const tapIntervals = useRef<number[]>([]);

  function resetTaps() {
    previousTap.current = null;
    tapIntervals.current = [];
    setTaps(0);
    setConsistency(null);
  }

  useEffect(() => {
    if (!running) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let position = 0;
    const period = 60_000 / bpm;
    let nextAt = performance.now() + period;

    function tick() {
      if (disposed) return;
      position = (position + 1) % 4;
      setBeat(position);
      void playNotes([position === 0 ? 84 : 76], 0.06).catch(() => {
        if (!disposed) {
          setAudioError(true);
          setRunning(false);
        }
      });
      nextAt += period;
      // Drop late beats instead of playing a burst after a throttled timer.
      if (nextAt < performance.now()) nextAt = performance.now() + period;
      timer = setTimeout(tick, Math.max(0, nextAt - performance.now()));
    }

    function pauseWhenHidden() {
      if (document.hidden) setRunning(false);
    }

    timer = setTimeout(tick, period);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      stopNotes();
    };
  }, [running, bpm]);

  function toggle() {
    if (running) {
      setRunning(false);
      return;
    }
    resetTaps();
    setBeat(0);
    setAudioError(false);
    // Initialize/resume audio in the explicit button gesture.
    void playNotes([84], 0.06).catch(() => {
      setAudioError(true);
      setRunning(false);
    });
    setRunning(true);
  }

  function tap() {
    if (!running) return;
    const now = performance.now();
    if (previousTap.current !== null) {
      const intervals = [
        ...tapIntervals.current,
        now - previousTap.current,
      ].slice(-16);
      tapIntervals.current = intervals;
      const expected = 60_000 / bpm;
      const meanError =
        intervals.reduce(
          (sum, interval) => sum + Math.abs(interval - expected),
          0
        ) / intervals.length;
      setConsistency(Math.max(0, Math.round(100 * (1 - meanError / expected))));
    }
    previousTap.current = now;
    setTaps((count) => count + 1);
  }

  return (
    <section className="sf-rhythm" aria-labelledby="sf-rhythm-title">
      <div className="sf-rhythm-heading">
        <h3 id="sf-rhythm-title">{copy('title')}</h3>
        <span className="sf-rhythm-meter">4/4</span>
      </div>
      <p>{copy('intro')}</p>
      <div className="sf-rhythm-tempo">
        <label htmlFor="sf-rhythm-bpm">
          {copy('tempo')} <strong>{bpm} BPM</strong>
        </label>
        <input
          id="sf-rhythm-bpm"
          type="range"
          min={40}
          max={160}
          step={1}
          value={bpm}
          disabled={running}
          onChange={(event) => {
            setBpm(Number(event.target.value));
            resetTaps();
          }}
          aria-describedby="sf-rhythm-tempo-help"
        />
        <small id="sf-rhythm-tempo-help">{copy('tempoHelp')}</small>
      </div>
      <div className="sf-rhythm-pulses" aria-hidden="true">
        {[0, 1, 2, 3].map((position) => (
          <span key={position} data-active={running && beat === position}>
            {position + 1}
          </span>
        ))}
      </div>
      <div className="sf-rhythm-actions">
        <button
          type="button"
          className="sf-rhythm-start"
          onClick={toggle}
          aria-pressed={running}
        >
          {running ? copy('stop') : copy('start')}
        </button>
        <button
          type="button"
          className="sf-rhythm-tap"
          disabled={!running}
          onClick={tap}
          onKeyDown={(event) => {
            if (event.repeat && (event.key === ' ' || event.key === 'Enter'))
              event.preventDefault();
          }}
        >
          {copy('tap')}
        </button>
        <button
          type="button"
          className="sf-rhythm-reset"
          onClick={resetTaps}
          disabled={taps === 0}
        >
          {copy('reset')}
        </button>
      </div>
      <dl className="sf-rhythm-results" aria-live="polite" aria-atomic="true">
        <div>
          <dt>{copy('taps')}</dt>
          <dd>{taps}</dd>
        </div>
        <div>
          <dt>{copy('consistency')}</dt>
          <dd>{consistency === null ? '—' : `${consistency}%`}</dd>
        </div>
      </dl>
      <p className="sf-rhythm-note">{copy('estimate')}</p>
      {audioError && (
        <p role="alert" className="sf-rhythm-error">
          {copy('audioError')}
        </p>
      )}
    </section>
  );
}
