import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { buildFaqPageSchema, buildWebPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas, localizeQnas, pickVisibleFaqItems } from '@/lib/qna';
import HomePageClient from '@/components/home/HomePageClient';
import { absoluteUrl, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site-url';
import { getPathname } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

function resolveLocale(localeParam: string): AppLocale {
  return (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : routing.defaultLocale) as AppLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const path = getPathname({ locale, href: '/' });
  const canonical = absoluteUrl(path);

  return {
    title: { absolute: SITE_TITLE },
    description: SITE_DESCRIPTION,
    alternates: {
      canonical,
      languages: {
        ko: absoluteUrl(getPathname({ locale: 'ko', href: '/' })),
        en: absoluteUrl(getPathname({ locale: 'en', href: '/' })),
        'x-default': absoluteUrl(getPathname({ locale: 'ko', href: '/' })),
      },
    },
    openGraph: {
      url: canonical,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
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
  const homeFaqSchema = homeFaqItems.length > 0 ? buildFaqPageSchema(homeFaqItems, homePath) : null;
  const webPageSchema = buildWebPageSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            homeFaqSchema ? [webPageSchema, homeFaqSchema] : webPageSchema
          ),
        }}
      />
      <HomePageClient homeFaqItems={homeFaqItems} />
    </>
  );
}
