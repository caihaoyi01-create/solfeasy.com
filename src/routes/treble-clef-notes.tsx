import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { NotesPage } from '@/blocks/music-pages';

export const Route = createFileRoute('/treble-clef-notes')({
  loader: () => musicMetadata('treble'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('treble')),
  component: () => <NotesPage page="treble" />,
});
