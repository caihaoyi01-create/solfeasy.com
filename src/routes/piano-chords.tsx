import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { ChordsPage } from '@/blocks/music-pages';

export const Route = createFileRoute('/piano-chords')({
  loader: () => musicMetadata('chords'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('chords')),
  component: () => <ChordsPage />,
});
