import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Music2,
  Target,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import {
  lessonExercises,
  type MusicLearningStatus,
} from '@/lib/music-learning';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PracticeOverview = {
  state: {
    attempts: number;
    correct: number;
    streak: number;
    best: number;
    remaining: number | null;
    premium: boolean;
    resetsAt: string;
  };
};

function DashboardPage() {
  const { data: session } = useSession();
  const t = (key: string) => tDynamic(`music.dashboard.${key}`);
  const locale = getLocale() === 'zh' ? 'zh-CN' : 'en-US';
  const learning = useQuery({
    queryKey: ['music-learning', session?.user?.id],
    enabled: Boolean(session?.user),
    queryFn: () => apiGet<MusicLearningStatus>('/api/music-learning'),
  });
  const practice = useQuery({
    queryKey: ['music-practice', 'dashboard', session?.user?.id],
    enabled: Boolean(session?.user),
    queryFn: () => apiGet<PracticeOverview>('/api/music-practice'),
  });
  const account = learning.data;
  const today = practice.data?.state;
  const completed = account?.progress ?? [];
  const plan = account
    ? account.subscriptionActive
      ? t('pro')
      : account.pro
        ? t('trial')
        : t('free')
    : '—';
  const trialEnd = account?.trialEndsAt
    ? new Date(account.trialEndsAt).toLocaleDateString(locale)
    : null;
  const planDescription = account?.subscriptionActive
    ? t('subscriptionActive')
    : account?.pro && trialEnd
      ? `${t('trialEnds')} ${trialEnd}`
      : account?.trialUsed
        ? t('trialExpired')
        : t('freeDescription');
  const stats = [
    {
      title: t('plan'),
      icon: Music2,
      value: plan,
      description: account ? planDescription : t('loading'),
    },
    {
      title: t('courseProgress'),
      icon: BookOpen,
      value: account ? `${completed.length} / ${lessonExercises.length}` : '—',
      description: t('lessonsCompleted'),
    },
    {
      title: t('todayScore'),
      icon: Target,
      value: today ? `${today.correct} / ${today.attempts}` : '—',
      description: t('correctAttempts'),
    },
    {
      title: t('bestStreak'),
      icon: Flame,
      value: today ? today.best : '—',
      description: t('streakDescription'),
    },
  ];
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {m['settings.welcome']({
              name: session?.user?.name || session?.user?.email || '',
            })}
          </p>
        </div>
        <Link href="/piano-lessons/" className={buttonVariants()}>
          {t('continue')}
          <ArrowRight size={16} />
        </Link>
      </div>
      {(learning.isError || practice.isError) && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 rounded-lg border p-4 text-sm"
        >
          <p>{t('loadError')}</p>
          <button
            className="mt-2 cursor-pointer underline"
            onClick={() => {
              if (learning.isError) void learning.refetch();
              if (practice.isError) void practice.refetch();
            }}
          >
            {t('retry')}
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('courseTitle')}</CardTitle>
            <CardDescription>{t('courseDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessonExercises.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm">
                    {tDynamic(`music.learning.lesson${index + 1}.title`)}
                  </span>
                </div>
                {account ? (
                  completed.includes(lesson.id) ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={15} />
                      {t('completed')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {lesson.premium && !account.pro
                        ? t('proLesson')
                        : t('notCompleted')}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            ))}
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href="/piano-lessons/"
            >
              {t('continue')}
              <ArrowRight size={16} />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('practiceTitle')}</CardTitle>
            <CardDescription>{t('practiceDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {today ? (
              <div className="rounded-lg border p-4">
                <p className="text-lg font-semibold">
                  {today.premium
                    ? t('unlimited')
                    : `${today.remaining} ${t('answersRemaining')}`}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {today.attempts === 0
                    ? t('noPractice')
                    : `${t('currentStreak')}: ${today.streak}`}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {t('resets')}{' '}
                  {new Date(today.resetsAt).toLocaleString(locale)} ·{' '}
                  {t('utcDay')}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {practice.isError ? t('unavailable') : t('loading')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link href="/" className={buttonVariants()}>
                {t('practiceNow')}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/treble-clef-notes/"
                className={buttonVariants({ variant: 'outline' })}
              >
                {t('treble')}
              </Link>
              <Link
                href="/bass-clef-notes/"
                className={buttonVariants({ variant: 'outline' })}
              >
                {t('bass')}
              </Link>
            </div>
            <p className="text-muted-foreground text-xs">{t('accountOnly')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/settings/')({
  component: DashboardPage,
});
