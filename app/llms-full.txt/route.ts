import { NextResponse } from 'next/server';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';
import {
    getGuideDocs,
    getQuoteFaqs,
    getServiceDocs,
    getUseCaseDocs,
    type LlmsDoc,
    type LlmsFaq,
} from '@/lib/llms-content';
import { getPublishedQnas, pickVisibleFaqItems } from '@/lib/qna';

export const dynamic = 'force-dynamic';

function faqBlock(faqs: LlmsFaq[]): string[] {
    return faqs.flatMap((f) => [`**Q. ${f.q}**`, '', `A. ${f.a}`, '']);
}

function docBlock(doc: LlmsDoc): string[] {
    return [
        `### ${doc.title}`,
        '',
        `- URL: ${doc.url}`,
        ...(doc.modified ? [`- Last updated: ${doc.modified}`] : []),
        '',
        doc.description,
        '',
        ...faqBlock(doc.faqs),
    ];
}

/**
 * AI 답변 엔진이 한 번에 읽을 수 있는 전체 요약본 — 페이지별 설명과 FAQ 전문(한국어).
 * 내용은 각 페이지 화면·FAQPage 스키마와 같은 출처(페이지 설정·번역 메시지)에서 생성한다.
 */
export async function GET() {
    let siteFaqs: LlmsFaq[] = [];
    try {
        const qnas = await getPublishedQnas();
        siteFaqs = pickVisibleFaqItems(qnas, 30).map((q) => ({ q: q.question, a: q.answer }));
    } catch {
        siteFaqs = [];
    }

    const body = [
        '# 와우쓰리디 (WOW3D) — 전체 콘텐츠 요약',
        '',
        `> (주)와우쓰리디(WOW3D)의 3D프린팅 자동견적·출력 서비스, 가이드, 자주 묻는 질문 전문입니다. 요약 목록은 ${absoluteUrl('/llms.txt')}, 원문은 각 URL을 참고하세요.`,
        '',
        '## 3D프린팅 자동견적',
        '',
        `- URL: ${absoluteUrl('/quote')}`,
        '',
        '3D 파일(STL·OBJ·3MF·PLY 즉시, STEP·STP 자동 변환) 또는 제품 사진을 올리면 부피·표면적·출력 시간을 분석해 FDM·SLA·DLP 방식별 가격을 즉시 보여 줍니다. 메쉬 오류는 자동 리페어하고, 벽 두께가 FDM 1mm·SLA/DLP 0.6mm보다 얇으면 경고합니다. 주문 후 평균 3~7일 내 수령합니다.',
        '',
        ...faqBlock(getQuoteFaqs('ko')),
        ...(siteFaqs.length > 0 ? ['## 자주 묻는 질문', '', `- URL: ${absoluteUrl('/qna')}`, '', ...faqBlock(siteFaqs)] : []),
        '## 서비스',
        '',
        ...getServiceDocs('ko').flatMap(docBlock),
        '## 용도별 활용 사례',
        '',
        ...getUseCaseDocs('ko').flatMap(docBlock),
        '## 가이드',
        '',
        ...getGuideDocs('ko').flatMap(docBlock),
        '---',
        `Source: ${SITE_URL} · Contact: 02-3144-3137, wow3d16@naver.com`,
    ].join('\n');

    return new NextResponse(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
