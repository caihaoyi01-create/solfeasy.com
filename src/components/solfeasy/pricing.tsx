import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

import { Link, useRouter } from '@/core/i18n/navigation';
import { pricingCatalog } from '@/config/pricing';
import { apiPost } from '@/lib/api-client';
import { currentPathWithQuery } from '@/lib/redirect';

import { TrialAction, useMusicLearning, type LearningCopy } from './lessons';

export function PricingContent({ copy }: { copy: LearningCopy }) {
  const [yearly, setYearly] = useState(false);
  const status = useMusicLearning();
  const router = useRouter();
  const t = (key: string) => copy[`music.pricing.${key}`];
  const product =
    pricingCatalog[yearly ? 'solfeasy_pro_yearly' : 'solfeasy_pro_monthly'];
  const displayedPrice = product.priceInCents / 100 / (yearly ? 12 : 1);
  const savings = Math.round(
    (1 -
      pricingCatalog.solfeasy_pro_yearly.priceInCents /
        (pricingCatalog.solfeasy_pro_monthly.priceInCents * 12)) *
      100
  );
  const amount = `$${(product.priceInCents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const monthlyAmount = `$${displayedPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const checkout = useMutation({
    mutationFn: () =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: product.productId,
        payment_provider: status.data?.paymentProvider,
        redirect: currentPathWithQuery('/pricing/'),
      }),
    onSuccess: (result) => {
      if (!result.checkout_url)
        throw new Error('Checkout is unavailable. Please try again later.');
      window.location.assign(result.checkout_url);
    },
  });
  return (
    <div className="sf-learning sf-pricing">
      <p className="sf-pricing-intro">{t('intro')}</p>
      <div className="sf-billing-toggle" role="group" aria-label={t('monthly')}>
        <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
          {t('monthly')}
        </button>
        <button aria-pressed={yearly} onClick={() => setYearly(true)}>
          {t('yearly').replace('%savings%', String(savings))}
        </button>
      </div>
      <div className="sf-pricing-grid">
        <section className="sf-price-card">
          <span className="sf-learning-eyebrow">{t('free')}</span>
          <h2>{t('freeDesc')}</h2>
          <p className="sf-price">
            $0 <small>{t('forever')}</small>
          </p>
          <Link className="sf-learning-button" href="/">
            {t('practice')}
            <ArrowRight size={16} />
          </Link>
          <ul>
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <Check size={16} />
                {t(`free${i}`)}
              </li>
            ))}
          </ul>
        </section>
        <section className="sf-price-card sf-price-pro">
          <span className="sf-learning-eyebrow">{t('pro')}</span>
          <h2>{t('proDesc')}</h2>
          <p className="sf-price">
            {monthlyAmount} <small>{t('perMonth')}</small>
          </p>
          <p className="sf-learning-muted sf-billing-detail">
            {(yearly ? t('yearBilling') : t('monthBilling'))
              .replace('%amount%', amount)
              .replace('%monthly%', monthlyAmount)}
          </p>
          <TrialAction copy={copy} compact />
          <ul>
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <Check size={16} />
                {t(`pro${i}`)}
              </li>
            ))}
          </ul>
          {status.data?.subscriptionActive ? (
            <Link className="sf-learning-button" href="/settings/billing">
              {t('manage')}
            </Link>
          ) : status.data?.paymentProvider ? (
            <>
              <button
                className="sf-learning-button sf-subscribe-button"
                disabled={checkout.isPending}
                onClick={() => {
                  if (!status.data.signedIn)
                    router.push(
                      `/sign-in?callbackUrl=${encodeURIComponent(currentPathWithQuery('/pricing/'))}`
                    );
                  else checkout.mutate();
                }}
              >
                {checkout.isPending ? t('checkout') : t('subscribe')}
                <ArrowRight size={16} />
              </button>
              <small className="sf-learning-muted">
                {t('provider')} {status.data.paymentProvider}
              </small>
            </>
          ) : status.isPending ? (
            <p className="sf-learning-muted">
              {copy['music.learning.loading']}
            </p>
          ) : (
            !status.isError && (
              <p className="sf-payment-unavailable">{t('unavailable')}</p>
            )
          )}
          {checkout.isError && (
            <p className="sf-learning-error" role="alert">
              {checkout.error.message}
              <button onClick={() => checkout.mutate()}>
                {copy['music.learning.retry']}
              </button>
            </p>
          )}
        </section>
      </div>
      <section className="sf-pricing-explainer">
        <ShieldCheck size={28} />
        <div>
          <h2>{t('details')}</h2>
          <p>{t('trialDetails')}</p>
        </div>
      </section>
      <div className="sf-pricing-faq">
        <details>
          <summary>{t('cancelTitle')}</summary>
          <p>{t('cancelBody')}</p>
        </details>
        <details>
          <summary>{t('refundTitle')}</summary>
          <p>
            {t('refundBody')}{' '}
            <Link href="/refund-policy">{t('refundLink')}</Link>
          </p>
        </details>
      </div>
      <p className="sf-learning-footnote">{t('noAds')}</p>
    </div>
  );
}
