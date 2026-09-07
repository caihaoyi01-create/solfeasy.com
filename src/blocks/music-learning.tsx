import { tDynamic } from '@/core/i18n/dynamic';
import { getLocale } from '@/paraglide/runtime.js';
import { LessonsContent } from '@/components/solfeasy/lessons';
import { PricingContent } from '@/components/solfeasy/pricing';

import manifest from '../../scripts/music-learning-copy.json';

function translatedCopy() {
  return {
    ...Object.fromEntries(
      Object.keys(manifest.en).map((key) => [key, tDynamic(key)])
    ),
    locale: getLocale(),
  };
}

export function LessonsPageContent() {
  return <LessonsContent copy={translatedCopy()} />;
}
export function PricingPageContent() {
  return <PricingContent copy={translatedCopy()} />;
}
