import type { ReactNode } from 'react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { ClefExplorer } from '@/components/music';
import { RhythmPractice } from '@/components/music/rhythm-practice';
import {
  guideSections,
  learningLinks,
  toolSections,
  type ToolPage,
} from '@/content/solfeasy/editorial-structure';

import '@/styles/music-editorial.css';

const text = (key: string) => tDynamic(`sf.editorial.${key}`);

function ReferenceTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="sf-editorial-table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th scope="col" key={header}>
                {text(`table.${header}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td key={column}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClefTable({ clef }: { clef?: 'treble' | 'bass' }) {
  const rows = [
    { clef: 'treble', notes: ['E4 · G4 · B4 · D5 · F5', 'F4 · A4 · C5 · E5'] },
    { clef: 'bass', notes: ['G2 · B2 · D3 · F3 · A3', 'A2 · C3 · E3 · G3'] },
  ];
  return (
    <ReferenceTable
      headers={['clef', 'lines', 'spaces']}
      rows={rows
        .filter((row) => !clef || row.clef === clef)
        .map((row) => [text(`table.${row.clef}`), ...row.notes])}
    />
  );
}

function AlphabetMap() {
  return (
    <div className="sf-editorial-map" aria-label="C D E F G A B">
      {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => (
        <span key={note}>{note}</span>
      ))}
    </div>
  );
}

function RelatedLessons({ exclude }: { exclude?: string }) {
  return (
    <section
      className="sf-editorial-related"
      aria-labelledby="sf-related-heading"
    >
      <h2 id="sf-related-heading">{text('related')}</h2>
      <div className="sf-editorial-links">
        {learningLinks
          .filter((link) => link.key !== exclude)
          .map((link) => (
            <Link href={link.href} key={link.key}>
              {text(`link.${link.key}`)} <span aria-hidden="true">↗</span>
            </Link>
          ))}
      </div>
    </section>
  );
}

function Contents({
  prefix,
  sections,
}: {
  prefix: string;
  sections: readonly string[];
}) {
  return (
    <nav className="sf-editorial-toc" aria-label={text('contents')}>
      <h2>{text('contents')}</h2>
      <ol>
        {sections.map((section, index) => (
          <li key={section}>
            <a href={`#${prefix}-${section}`}>
              {String(index + 1).padStart(2, '0')} ·{' '}
              {text(`${prefix}.${section}.title`)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ToolEditorial({ page }: { page: ToolPage }) {
  const sections = toolSections[page];
  return (
    <article
      className="sf-editorial"
      aria-labelledby={`sf-${page}-guide-title`}
    >
      <header className="sf-editorial-heading">
        <span className="sf-editorial-kicker">{text('kicker')}</span>
        <h2 id={`sf-${page}-guide-title`}>{text(`${page}.title`)}</h2>
        <p>{text(`${page}.intro`)}</p>
      </header>
      <div className="sf-editorial-grid">
        <div className="sf-editorial-prose">
          {sections.map((section, index) => (
            <section
              className="sf-editorial-section"
              id={`${page}-${section}`}
              key={section}
            >
              <span className="sf-editorial-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{text(`${page}.${section}.title`)}</h3>
              {[0, 1, 2].map((paragraph) => (
                <p key={paragraph}>
                  {text(`${page}.${section}.p${paragraph}`)}
                </p>
              ))}
              {page === 'home' && section === 'map' && <AlphabetMap />}
              {page === 'treble' && section === 'lines' && (
                <ClefTable clef="treble" />
              )}
              {page === 'bass' && section === 'landmarks' && (
                <ClefTable clef="bass" />
              )}
              {page === 'chords' && section === 'quality' && <ChordTable />}
            </section>
          ))}
        </div>
        <Contents prefix={page} sections={sections} />
      </div>
      <RelatedLessons exclude={page} />
    </article>
  );
}

function ChordTable() {
  return (
    <ReferenceTable
      headers={['chord', 'formula', 'example']}
      rows={[
        ['C', '0 · 4 · 7', 'C · E · G'],
        ['Cm', '0 · 3 · 7', 'C · E♭ · G'],
        ['C7', '0 · 4 · 7 · 10', 'C · E · G · B♭'],
        ['Cmaj7', '0 · 4 · 7 · 11', 'C · E · G · B'],
        ['Csus4', '0 · 5 · 7', 'C · F · G'],
      ]}
    />
  );
}

function GuideIllustration({ section }: { section: string }) {
  if (section === 'staff-clefs') {
    return (
      <>
        <ClefTable />
        <h3>{text('guide.explorer')}</h3>
        <ClefExplorer />
      </>
    );
  }
  if (section === 'alphabet') return <AlphabetMap />;
  if (section === 'rhythm') {
    return (
      <>
        <ReferenceTable
          headers={['note', 'beats']}
          rows={[
            [text('table.whole'), '4'],
            [text('table.half'), '2'],
            [text('table.quarter'), '1'],
            [text('table.eighth'), '½'],
            [text('table.sixteenth'), '¼'],
          ]}
        />
        <aside className="sf-editorial-aside">
          <p>{text('guide.rhythm-tip')}</p>
        </aside>
        <RhythmPractice />
      </>
    );
  }
  if (section === 'time-signatures') {
    return (
      <>
        <ReferenceTable
          headers={['meter', 'count', 'feel']}
          rows={[
            ['4/4', '1 · 2 · 3 · 4', text('table.four')],
            ['3/4', '1 · 2 · 3', text('table.three')],
            ['6/8', '(1 · 2 · 3) (4 · 5 · 6)', text('table.six')],
          ]}
        />
        <p className="sf-editorial-source">
          <a
            href="https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/"
            target="_blank"
            rel="noreferrer"
          >
            {text('guide.source')} ↗
          </a>
        </p>
      </>
    );
  }
  if (section === 'rests-dynamics') {
    return (
      <ReferenceTable
        headers={['dynamic', 'meaning']}
        rows={[
          ['p', text('table.p')],
          ['mp', text('table.mp')],
          ['mf', text('table.mf')],
          ['f', text('table.f')],
          ['cresc.', text('table.crescendo')],
        ]}
      />
    );
  }
  return null;
}

export function ReadingGuide() {
  return (
    <article className="sf-editorial" aria-labelledby="sf-reading-guide-title">
      <header className="sf-editorial-heading">
        <span className="sf-editorial-kicker">{text('kicker')}</span>
        <h2 id="sf-reading-guide-title">{text('guide.title')}</h2>
        <p>{text('guide.intro')}</p>
      </header>
      <div className="sf-editorial-grid">
        <div className="sf-editorial-prose">
          {guideSections.map((section, index) => {
            const paragraphs = ['staff-clefs', 'rhythm', 'faq'].includes(
              section
            )
              ? [0, 1, 2, 3]
              : [0, 1, 2];
            return (
              <section
                className="sf-editorial-section"
                id={`guide-${section}`}
                key={section}
              >
                <span className="sf-editorial-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{text(`guide.${section}.title`)}</h3>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>
                    {text(`guide.${section}.p${paragraph}`)}
                  </p>
                ))}
                <GuideIllustration section={section} />
                {section === 'staff-clefs' && (
                  <div className="sf-editorial-links">
                    <Link href="/treble-clef-notes/">
                      {text('link.treble')} ↗
                    </Link>
                    <Link href="/bass-clef-notes/">{text('link.bass')} ↗</Link>
                  </div>
                )}
                {section === 'practice' && (
                  <div className="sf-editorial-links">
                    <Link href="/piano-lessons/">{text('link.lessons')} ↗</Link>
                  </div>
                )}
              </section>
            );
          })}
        </div>
        <Contents prefix="guide" sections={guideSections} />
      </div>
      <RelatedLessons exclude="guide" />
    </article>
  );
}
