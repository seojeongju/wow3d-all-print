import type { Metadata } from 'next';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildFaqPageSchema } from '@/lib/aeo-schema';
import { getPublishedQnas } from '@/lib/qna';
import QnAPageClient from './QnAPageClient';

export const metadata: Metadata = {
  title: '3D 프린팅 FAQ와 자주 묻는 질문',
  description:
    '3D 프린팅 견적 계산, FDM·SLA·DLP 차이, STL 파일 업로드, 제작 기간, 후가공 등 WOW3D 고객이 자주 묻는 질문을 한곳에 정리했습니다.',
};

export default async function QnAPage() {
  const qnas = await getPublishedQnas();
  const faqSchema = buildFaqPageSchema(qnas);
  const collectionSchema = buildCollectionPageSchema({
    name: '3D 프린팅 FAQ와 자주 묻는 질문',
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
      {(qnas.length > 0 || collectionSchema || breadcrumbSchema) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([faqSchema, collectionSchema, breadcrumbSchema].filter(Boolean)),
          }}
        />
      )}
      <QnAPageClient initialQnas={qnas} />
    </>
  );
}
