import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { NotesPage } from '@/blocks/music-pages';

export const Route = createFileRoute('/bass-clef-notes')({
  loader: () => musicMetadata('bass'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('bass')),
  component: () => <NotesPage page="bass" />,
});
