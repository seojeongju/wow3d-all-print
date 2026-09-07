import type { Metadata } from 'next';
import { buildFaqPageSchema, buildWebPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas, pickVisibleFaqItems } from '@/lib/qna';
import HomePageClient from '@/components/home/HomePageClient';
import { absoluteUrl, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site-url';

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    url: absoluteUrl('/'),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function HomePage() {
  const qnas = await getPublishedQnas();
  const homeFaqItems = pickVisibleFaqItems(qnas, 6);
  const homeFaqSchema = homeFaqItems.length > 0 ? buildFaqPageSchema(homeFaqItems, '/') : null;
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
