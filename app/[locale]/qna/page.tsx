import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFaqPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas, pickVisibleFaqItems } from '@/lib/qna';
import QnAPageClient from './QnAPageClient';

/** 화면 1페이지(기본)에 보이는 개수와 FAQ JSON-LD를 맞춤. 사진(이미지)→3D 항목은 상단에 고정 */
const FAQ_SCHEMA_VISIBLE_COUNT = 8;

export default async function QnAPage() {
  const qnas = await getPublishedQnas();
  const orderedQnas = pickVisibleFaqItems(qnas, qnas.length);
  const visibleForSchema = orderedQnas.slice(0, FAQ_SCHEMA_VISIBLE_COUNT);
  const faqSchema = visibleForSchema.length > 0 ? buildFaqPageSchema(visibleForSchema) : null;
  const collectionSchema = buildCollectionPageSchema({
    name: '3D 프린팅 FAQ · 사진(이미지) 3D 모델링',
    description:
      '사진(이미지) 파일을 3D 모델링으로 변환하는 방법, 3D 프린팅 견적, 파일 업로드, 제작 기간, 출력 방식에 대한 질문과 답변 모음입니다.',
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
      <QnAPageClient initialQnas={orderedQnas} />
    </>
  );
}
