import { useEffect, useRef } from 'react';

import { tDynamic as t } from '@/core/i18n/dynamic';

/** Explicit editorial slots only. Enable only with AdSense Auto ads disabled. */
export function EditorialAd({ position }: { position: 'top' | 'bottom' }) {
  const element = useRef<HTMLModElement | null>(null);
  const publisher = import.meta.env.VITE_ADSENSE_CLIENT || '';
  const slot =
    (position === 'top'
      ? import.meta.env.VITE_ADSENSE_SLOT_TOP
      : import.meta.env.VITE_ADSENSE_SLOT_BOTTOM) || '';
  const valid = /^ca-pub-\d{16}$/.test(publisher) && /^\d+$/.test(slot);
  useEffect(() => {
    if (!valid || !element.current) return;
    let loader = document.getElementById(
      'sf-manual-ads'
    ) as HTMLScriptElement | null;
    if (!loader) {
      loader = document.createElement('script');
      loader.id = 'sf-manual-ads';
      loader.async = true;
      loader.crossOrigin = 'anonymous';
      loader.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;
      document.head.appendChild(loader);
    }
    if (!element.current.dataset.adRequested) {
      element.current.dataset.adRequested = 'true';
      const scope = window as unknown as { adsbygoogle?: unknown[] };
      (scope.adsbygoogle ||= []).push({});
    }
  }, [valid, publisher, slot]);
  if (!valid) return null;
  return (
    <aside className="sf-ad" aria-label={t('sf.ad.label')}>
      <small>{t('sf.ad.label')}</small>
      <ins
        ref={element}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 90 }}
        data-ad-client={publisher}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
