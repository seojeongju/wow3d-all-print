import type { QnAItem } from '@/lib/qna';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';

export function buildFaqPageSchema(items: QnAItem[], pagePath = '/qna') {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
        url: `${SITE_URL}${pagePath}`,
    };
}

/** 3D 프린팅 견적 요청 4단계 (홈 ProcessSection과 동일) */
export function buildQuoteHowToSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '와우쓰리디 3D 프린팅 견적 받는 방법',
        description:
            'STL·OBJ·3MF 파일을 업로드하고 출력 옵션을 선택한 뒤 주문·결제까지 진행하는 3D 프린팅 견적·주문 절차입니다.',
        totalTime: 'PT10M',
        supply: [
            { '@type': 'HowToSupply', name: '3D 모델 파일 (STL, OBJ, 3MF, PLY 등)' },
        ],
        tool: [
            { '@type': 'HowToTool', name: '와우쓰리디 웹 자동견적 시스템' },
        ],
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: '파일 업로드 및 분석',
                text: 'STL·OBJ·3MF·PLY 파일을 업로드하면 부피·표면적·치수가 자동 분석됩니다. 3D 뷰어에서 확인 후 견적 단계로 진행합니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: '견적 및 옵션 선택',
                text: '출력 방식(FDM·SLA·DLP), 소재, 내부 채움·레이어 두께를 선택하면 가격이 실시간 반영됩니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: '주문 및 결제',
                text: '배송지·수령인·연락처를 입력하고 결제를 완료하면 주문이 접수됩니다.',
                url: absoluteUrl('/quotes'),
            },
            {
                '@type': 'HowToStep',
                position: 4,
                name: '제작·검수·배송',
                text: '주문 확정 후 산업용 프린터로 제작이 시작되며, 검수·후처리 후 발송됩니다. 평균 3~7일 내 수령 가능합니다.',
                url: SITE_URL,
            },
        ],
    };
}

export function buildWebSiteSearchActionSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '(주)와우쓰리디',
        alternateName: ['와우쓰리디', 'WOW3D', '와우3D'],
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/qna?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}
