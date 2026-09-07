import { ArrowRight } from 'lucide-react';

import { tDynamic as t } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';

function NoteArtwork({ type }: { type: 'notes' | 'chords' | 'read' }) {
  if (type === 'chords')
    return (
      <svg viewBox="0 0 300 132" aria-hidden="true">
        <g transform="translate(77,13) rotate(-12 74 65)">
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={i * 19}
              y="12"
              width="18"
              height="110"
              rx="4"
              fill={[0, 2, 4].includes(i) ? '#c6c0f7' : '#f3f0ed'}
              stroke="#484565"
              strokeWidth="1"
            />
          ))}
          {[0, 1, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={i * 19 + 13}
              y="12"
              width="12"
              height="64"
              rx="3"
              fill="#25253c"
            />
          ))}
          <circle cx="9" cy="104" r="4" fill="#665ba8" />
          <circle cx="47" cy="104" r="4" fill="#665ba8" />
          <circle cx="85" cy="104" r="4" fill="#665ba8" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 300 132" aria-hidden="true">
      <g
        transform={
          type === 'notes'
            ? 'translate(25,12) rotate(-8 130 50)'
            : 'translate(20,14) rotate(7 130 50)'
        }
      >
        {[31, 43, 55, 67, 79].map((y) => (
          <line
            key={y}
            x1="8"
            x2="250"
            y1={y}
            y2={y}
            stroke="#e5dedc"
            strokeOpacity=".25"
          />
        ))}
        <text
          x="19"
          y="89"
          fontFamily="Georgia,serif"
          fontSize="80"
          fill="#f4e9e0"
        >
          𝄞
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g
            key={i}
            transform={`translate(${90 + i * 37},${type === 'notes' ? 67 - i * 6 : 49 + (i % 2) * 12})`}
          >
            <ellipse
              rx="8"
              ry="5.5"
              transform="rotate(-22)"
              fill={i === 2 ? '#ffe1a9' : '#f4e9e0'}
            />
            <line
              x1="7"
              x2="7"
              y1="-1"
              y2="-34"
              stroke="#f4e9e0"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function DiscoverTools() {
  const cards = [
    {
      key: 'treble',
      href: '/treble-clef-notes/',
      color: 'coral',
      art: 'notes',
    },
    { key: 'chords', href: '/piano-chords/', color: 'lilac', art: 'chords' },
    { key: 'guide', href: '/how-to-read-music/', color: 'teal', art: 'read' },
  ] as const;
  return (
    <section aria-labelledby="discover-heading">
      <div className="sf-section-title">
        <h2 id="discover-heading">{t('sf.discover.title')}</h2>
        <Link href="/how-to-read-music/">{t('sf.discover.all')} ↗</Link>
      </div>
      <div className="sf-discover-grid">
        {cards.map((card) => (
          <Link href={card.href} className="sf-discover-card" key={card.key}>
            <div className={`sf-card-art sf-art-${card.color}`}>
              <NoteArtwork type={card.art} />
              <span className="sf-card-label">
                {t(`sf.discover.${card.key}.label`)}
              </span>
            </div>
            <div className="sf-card-body">
              <h3>
                {t(`sf.discover.${card.key}.title`)}
                <ArrowRight aria-hidden="true" />
              </h3>
              <p>{t(`sf.discover.${card.key}.description`)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
