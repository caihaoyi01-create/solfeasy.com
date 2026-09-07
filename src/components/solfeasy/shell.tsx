import { type ReactNode } from 'react';
import {
  AudioLines,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Globe2,
  GraduationCap,
  Home,
  KeyboardMusic,
  Music2,
  Music4,
  Sparkles,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { tDynamic as t } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { getLocale, setLocale } from '@/paraglide/runtime.js';
import { BuiltWithShipAny } from '@/components/built-with-shipany';

import '@/styles/solfeasy.css';

export type MusicPageKey =
  | 'home'
  | 'treble'
  | 'bass'
  | 'chords'
  | 'guide'
  | 'lessons'
  | 'pricing';
const navigation = [
  { key: 'home', href: '/', icon: Home },
  { key: 'treble', href: '/treble-clef-notes/', icon: Music2 },
  { key: 'bass', href: '/bass-clef-notes/', icon: Music4 },
  { key: 'chords', href: '/piano-chords/', icon: KeyboardMusic },
  { key: 'guide', href: '/how-to-read-music/', icon: BookOpen },
  { key: 'lessons', href: '/piano-lessons/', icon: GraduationCap },
  { key: 'pricing', href: '/pricing/', icon: Sparkles },
] as const;

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link href="/" className={`sf-brand ${mobile ? 'sf-mobile-brand' : ''}`}>
      <img src="/logo.svg" alt="" width="31" height="34" />
      <span>{envConfigs.app_name.toLowerCase()}</span>
    </Link>
  );
}

export function MusicShell({
  page,
  children,
}: {
  page: MusicPageKey;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const locale = getLocale();
  const renderNav = (start: number, end: number) =>
    navigation.slice(start, end).map(({ key, href, icon: Icon }) => (
      <Link
        key={key}
        href={href}
        aria-current={page === key ? 'page' : undefined}
      >
        <Icon aria-hidden="true" />
        <span>{t(`sf.nav.${key}`)}</span>
      </Link>
    ));
  return (
    <div className="sf-app">
      <a className="sf-skip" href="#main-content">
        {t('sf.skip')}
      </a>
      <aside className="sf-sidebar">
        <Brand />
        <div className="sf-nav-label">{t('sf.nav.practice')}</div>
        <nav className="sf-nav" aria-label={t('sf.nav.practice')}>
          {renderNav(0, 4)}
        </nav>
        <div className="sf-nav-label">{t('sf.nav.learn')}</div>
        <nav className="sf-nav" aria-label={t('sf.nav.learn')}>
          {renderNav(4, 7)}
        </nav>
        <div className="sf-sidebar-bottom">
          <div className="sf-sidebar-note">
            <AudioLines size={16} />
            <span>{t('sf.sidebar.line')}</span>
          </div>
          <p>{t('sf.sidebar.caption')}</p>
        </div>
      </aside>
      <div className="sf-workspace">
        <header className="sf-topbar">
          <Brand mobile />
          <div className="sf-breadcrumb">
            <span>{t('sf.studio')}</span>
            <ChevronRight size={13} />
            <strong>{t(`sf.nav.${page}`)}</strong>
          </div>
          <div className="sf-top-actions">
            <button
              className="sf-locale"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              aria-label={locale === 'en' ? '切换到中文' : 'Switch to English'}
            >
              <Globe2 size={14} />
              {locale === 'en' ? 'EN' : '中文'}
            </button>
            <Link href={session?.user ? '/settings' : '/sign-in'}>
              {session?.user ? t('sf.account') : t('sf.signin')}
            </Link>
          </div>
        </header>
        <nav className="sf-mobile-nav" aria-label={t('sf.navigation')}>
          {navigation.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              aria-current={page === key ? 'page' : undefined}
            >
              {t(`sf.nav.${key}`)}
            </Link>
          ))}
        </nav>
        <main id="main-content" className="sf-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="sf-footer">
          <span>
            © {new Date().getFullYear()} {envConfigs.app_name}.{' '}
            {t('sf.footer.line')}
          </span>
          <nav aria-label={t('sf.footer.navigation')}>
            <Link href="/how-to-read-music/">{t('sf.nav.guide')}</Link>
            <Link href="/privacy-policy">{t('sf.privacy')}</Link>
            <Link href="/terms-of-service">{t('sf.terms')}</Link>
          </nav>
          <BuiltWithShipAny className="sf-built" />
        </footer>
      </div>
    </div>
  );
}

export function MusicHeading({ page }: { page: MusicPageKey }) {
  return (
    <div
      className={`sf-page-heading ${page === 'lessons' || page === 'pricing' ? 'sf-conversion-heading' : ''}`}
    >
      <span className="sf-eyebrow">
        <AudioLines size={13} />
        {t(`sf.${page}.eyebrow`)}
      </span>
      <h1>{t(`sf.${page}.h1`)}</h1>
      <p>{t(`sf.${page}.intro`)}</p>
    </div>
  );
}
