import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { GuidePage } from '@/blocks/music-pages';

export const Route = createFileRoute('/how-to-read-music')({
  loader: () => musicMetadata('guide'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('guide')),
  component: () => <GuidePage />,
});
