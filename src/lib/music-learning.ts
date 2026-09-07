export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const MUSIC_PRODUCT_IDS = [
  'solfeasy_pro_monthly',
  'solfeasy_pro_yearly',
];

/** Only announce recurring checkout when renewal webhooks and product mapping can work. */
export function configuredMusicPaymentProvider(
  configs: Record<string, string>
): string | null {
  let creemMapping: Record<string, unknown> = {};
  try {
    creemMapping = JSON.parse(configs.creem_product_ids_mapping || '{}') ?? {};
  } catch {
    /* Invalid mapping keeps Creem unavailable. */
  }
  const providers = [
    ...((configs.stripe_secret_key || configs.stripe_api_key) &&
    (configs.stripe_signing_secret || configs.stripe_webhook_secret)
      ? ['stripe']
      : []),
    ...(configs.creem_enabled === 'true' &&
    configs.creem_api_key &&
    configs.creem_signing_secret &&
    MUSIC_PRODUCT_IDS.every(
      (id) =>
        typeof creemMapping[id] === 'string' &&
        (creemMapping[id] as string).trim().length > 0
    )
      ? ['creem']
      : []),
  ];
  return providers.includes(configs.default_payment_provider)
    ? configs.default_payment_provider
    : (providers[0] ?? null);
}

/** Shared, deterministic exercises. MIDI numbers retain octave information. */
export const lessonExercises = [
  {
    id: 'middle-c',
    premium: false,
    notes: [60, 62, 64, 62, 60],
    beats: [1, 1, 1, 1, 2],
  },
  {
    id: 'first-melody',
    premium: true,
    notes: [64, 62, 60, 62, 64, 64, 64],
    beats: [1, 1, 1, 1, 1, 1, 2],
  },
  {
    id: 'steady-rhythm',
    premium: true,
    notes: [60, 60, 64, 64, 67],
    beats: [1, 1, 2, 2, 2],
  },
  {
    id: 'left-hand',
    premium: true,
    notes: [48, 52, 55, 52, 48],
    beats: [1, 1, 1, 1, 2],
  },
] as const;

export function validateLessonAttempt(
  lessonId: string,
  notes: number[],
  intervals?: number[]
) {
  const lesson = lessonExercises.find((item) => item.id === lessonId);
  if (
    !lesson ||
    notes.length !== lesson.notes.length ||
    notes.some((note, i) => note !== lesson.notes[i])
  )
    return false;
  // Rhythm lesson is checked at 80 bpm, allowing a beginner-friendly ±35%.
  if (lessonId === 'steady-rhythm') {
    if (!intervals || intervals.length !== notes.length - 1) return false;
    return intervals.every(
      (duration, i) =>
        Number.isFinite(duration) &&
        Math.abs(duration - lesson.beats[i] * 750) <=
          lesson.beats[i] * 750 * 0.35
    );
  }
  return true;
}

export function hasEffectiveMusicSubscription(
  subscription: {
    productId: string | null;
    status: string;
    currentPeriodEnd: Date | null;
    deletedAt?: Date | null;
  },
  now = new Date()
) {
  return Boolean(
    subscription.productId &&
    MUSIC_PRODUCT_IDS.includes(subscription.productId) &&
    !subscription.deletedAt &&
    ['active', 'pending_cancel', 'trialing'].includes(subscription.status) &&
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > now
  );
}

export type MusicLearningStatus = {
  signedIn: boolean;
  pro: boolean;
  subscriptionActive: boolean;
  trialUsed: boolean;
  trialEndsAt: string | null;
  progress: string[];
  paymentProvider: string | null;
};
