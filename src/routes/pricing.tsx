import { createFileRoute } from '@tanstack/react-router';

import { musicHead, musicMetadata } from '@/lib/solfeasy-seo';
import { PricingPageContent } from '@/blocks/music-learning';
import { MusicHeading, MusicShell } from '@/components/solfeasy/shell';

export const Route = createFileRoute('/pricing')({
  loader: () => musicMetadata('pricing'),
  head: ({ loaderData }) => musicHead(loaderData ?? musicMetadata('pricing')),
  component: () => (
    <MusicShell page="pricing">
      <MusicHeading page="pricing" />
      <PricingPageContent />
    </MusicShell>
  ),
});
