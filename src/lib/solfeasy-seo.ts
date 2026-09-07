import { tDynamic } from '@/core/i18n/dynamic';
import { envConfigs } from '@/config';
import { getLocale, locales } from '@/paraglide/runtime.js';

export const musicPaths = {
  home: '/',
  bass: '/bass-clef-notes/',
  treble: '/treble-clef-notes/',
  chords: '/piano-chords/',
  guide: '/how-to-read-music/',
  lessons: '/piano-lessons/',
  pricing: '/pricing/',
} as const;
export type MusicPage = keyof typeof musicPaths;
export function musicMetadata(page: MusicPage) {
  return {
    title: tDynamic(`sf.${page}.title`).replace('[Brand]', envConfigs.app_name),
    description: tDynamic(`sf.${page}.description`),
    locale: getLocale(),
    page,
  };
}
export function musicHead(data: ReturnType<typeof musicMetadata>) {
  const site = envConfigs.site_url;
  const urlFor = (locale: string) =>
    `${site}${locale === 'en' ? '' : `/${locale}`}${musicPaths[data.page]}`;
  return {
    meta: [
      { title: data.title },
      { name: 'description', content: data.description },
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:url', content: urlFor(data.locale) },
      {
        property: 'og:type',
        content: data.page === 'guide' ? 'article' : 'website',
      },
      { property: 'og:site_name', content: envConfigs.app_name },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [
      { rel: 'canonical', href: urlFor(data.locale) },
      ...locales.map((locale) => ({
        rel: 'alternate',
        hrefLang: locale,
        href: urlFor(locale),
      })),
      { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': data.page === 'guide' ? 'LearningResource' : 'WebPage',
          name: data.title,
          description: data.description,
          url: urlFor(data.locale),
          inLanguage: data.locale,
          isPartOf: {
            '@type': 'WebSite',
            name: envConfigs.app_name,
            url: site,
          },
        }).replace(/</g, '\\u003c'),
      },
    ],
  };
}
