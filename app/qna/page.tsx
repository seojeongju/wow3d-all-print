import { buildFaqPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas } from '@/lib/qna';
import QnAPageClient from './QnAPageClient';

export default async function QnAPage() {
  const qnas = await getPublishedQnas();
  const faqSchema = buildFaqPageSchema(qnas);

  return (
    <>
      {qnas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <QnAPageClient initialQnas={qnas} />
    </>
  );
}
