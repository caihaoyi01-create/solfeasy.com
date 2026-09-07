import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { NotesPage } from '@/blocks/music-pages';

export const Route = createFileRoute('/')({
  loader: () => musicMetadata('home'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('home')),
  component: () => <NotesPage page="home" />,
});
