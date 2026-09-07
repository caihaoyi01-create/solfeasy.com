/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';
import { envConfigs } from '@/config';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

/**
 * Solfeasy subscription catalog. Trial access is managed separately, with no payment required.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  solfeasy_pro_monthly: {
    productId: 'solfeasy_pro_monthly',
    productName: envConfigs.app_name + ' Pro',
    planName: envConfigs.app_name + ' Pro',
    description:
      'Unlimited music practice and beginner piano lessons, billed monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 900,
    currency: 'usd',
    credits: 0,
    plan: {
      name: envConfigs.app_name + ' Pro',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  solfeasy_pro_yearly: {
    productId: 'solfeasy_pro_yearly',
    productName: envConfigs.app_name + ' Pro',
    planName: envConfigs.app_name + ' Pro',
    description:
      'Unlimited music practice and beginner piano lessons, billed yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 7200,
    currency: 'usd',
    credits: 0,
    plan: {
      name: envConfigs.app_name + ' Pro',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
