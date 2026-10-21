import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildFaqPageSchema, buildWebPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas, localizeQnas, pickVisibleFaqItems, type QnAItem } from '@/lib/qna';
import HomePageClient from '@/components/home/HomePageClient';
import HomeKeyAnswers from '@/components/home/HomeKeyAnswers';
import { HOME_KEY_QUESTIONS } from '@/lib/guide-key-answers';
import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider';
import { absoluteUrl, buildOgImages } from '@/lib/site-url';
import { getPathname } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

/** DB(D1) 내용을 표시 — 빌드 시점 정적 생성 금지 */
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

function resolveLocale(localeParam: string): AppLocale {
  return (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const path = getPathname({ locale, href: '/' });
  const canonical = absoluteUrl(path);
  const title = t('metaTitle');
  const description = t('metaDescription');

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        ko: absoluteUrl(getPathname({ locale: 'ko', href: '/' })),
        en: absoluteUrl(getPathname({ locale: 'en', href: '/' })),
        'x-default': absoluteUrl(getPathname({ locale: 'ko', href: '/' })),
      },
    },
    openGraph: {
      images: buildOgImages(locale),
      url: canonical,
      title,
      description,
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  setRequestLocale(locale);

  const qnas = await getPublishedQnas();
  const homeFaqItems = localizeQnas(pickVisibleFaqItems(qnas, 6), locale);
  const homePath = getPathname({ locale, href: '/' });
  // 화면의 핵심 답변 3개 + 홈 FAQ를 한 FAQPage로 (화면 문구와 동일)
  const keyQnas: QnAItem[] = HOME_KEY_QUESTIONS.map((q, i) => ({
    id: -(i + 1),
    question: locale === 'en' ? q.question.en : q.question.ko,
    answer: locale === 'en' ? q.answer.en : q.answer.ko,
    category: 'key-answer',
  }));
  const homeFaqSchema = buildFaqPageSchema([...keyQnas, ...homeFaqItems], homePath);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const webPageSchema = buildWebPageSchema({
    name: t('metaTitle'),
    description: t('metaDescription'),
    path: homePath,
    locale,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webPageSchema, homeFaqSchema]),
        }}
      />
      <ScopedIntlProvider scope="home" locale={locale}>
        <HomePageClient homeFaqItems={homeFaqItems} keyAnswers={<HomeKeyAnswers locale={locale} />} />
      </ScopedIntlProvider>
    </>
  );
}
