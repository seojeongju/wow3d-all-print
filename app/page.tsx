import { buildFaqPageSchema, buildWebPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas } from '@/lib/qna';
import HomePageClient from '@/components/home/HomePageClient';

export default async function HomePage() {
  const qnas = await getPublishedQnas();
  const homeFaqItems = qnas.slice(0, 6);
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
