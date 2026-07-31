import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFaqPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas } from '@/lib/qna';
import QnAPageClient from './QnAPageClient';

/** 화면 1페이지(기본)에 보이는 개수와 FAQ JSON-LD를 맞춤 */
const FAQ_SCHEMA_VISIBLE_COUNT = 6;

export default async function QnAPage() {
  const qnas = await getPublishedQnas();
  const visibleForSchema = qnas.slice(0, FAQ_SCHEMA_VISIBLE_COUNT);
  const faqSchema = visibleForSchema.length > 0 ? buildFaqPageSchema(visibleForSchema) : null;
  const collectionSchema = buildCollectionPageSchema({
    name: '3D 프린팅 FAQ · 자주 묻는 질문',
    description:
      '3D 프린팅 견적 계산, 파일 업로드, 제작 기간, 출력 방식 선택과 관련된 질문과 답변 모음입니다.',
    path: '/qna',
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: 'FAQ', path: '/qna' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            [faqSchema, collectionSchema, breadcrumbSchema].filter(Boolean)
          ),
        }}
      />
      <QnAPageClient initialQnas={qnas} />
    </>
  );
}
