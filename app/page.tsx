import { buildFaqPageSchema, buildQuoteHowToSchema, buildWebSiteSearchActionSchema } from '@/lib/aeo-schema';
import { getPublishedQnas } from '@/lib/qna';
import HomePageClient from '@/components/home/HomePageClient';

export default async function HomePage() {
  const qnas = await getPublishedQnas();
  const homeFaqItems = qnas.slice(0, 6);
  const homeFaqSchema = homeFaqItems.length > 0 ? buildFaqPageSchema(homeFaqItems, '/') : null;
  const quoteHowToSchema = buildQuoteHowToSchema();
  const webSiteSchema = buildWebSiteSearchActionSchema();

  return (
    <>
      {(homeFaqSchema || quoteHowToSchema || webSiteSchema) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              [homeFaqSchema, quoteHowToSchema, webSiteSchema].filter(Boolean)
            ),
          }}
        />
      )}
      <HomePageClient homeFaqItems={homeFaqItems} />
    </>
  );
}
