import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { LessonsPageContent } from '@/blocks/music-learning';
import { MusicHeading, MusicShell } from '@/components/solfeasy/shell';

export const Route = createFileRoute('/piano-lessons')({
  loader: () => musicMetadata('lessons'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('lessons')),
  component: () => (
    <MusicShell page="lessons">
      <MusicHeading page="lessons" />
      <LessonsPageContent />
    </MusicShell>
  ),
});
