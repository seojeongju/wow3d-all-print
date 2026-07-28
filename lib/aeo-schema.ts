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

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

export function buildCollectionPageSchema(input: {
    name: string;
    description: string;
    path: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: input.name,
        description: input.description,
        url: absoluteUrl(input.path),
    };
}

export function buildArticleSchema(input: {
    headline: string;
    description: string;
    path: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: input.headline,
        description: input.description,
        author: {
            '@type': 'Organization',
            name: '(주)와우쓰리디',
        },
        publisher: {
            '@type': 'Organization',
            name: '(주)와우쓰리디',
        },
        mainEntityOfPage: absoluteUrl(input.path),
        url: absoluteUrl(input.path),
    };
}

export function buildBusinessSchemas() {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: '(주)와우쓰리디',
            alternateName: ['WOW3D', '와우쓰리디', '와우3D'],
            url: SITE_URL,
            logo: absoluteUrl('/thumbnail.png'),
            image: absoluteUrl('/og-image-v2.jpg'),
            email: 'wow3d16@naver.com',
            telephone: '02-3144-3137',
            sameAs: [
                'https://www.band.us/@3dcookiehd',
                'https://blog.naver.com/3dcookiehd',
                'https://www.instagram.com/3dcookie_hd/',
                'https://ko-kr.facebook.com/3dfabcafe/',
            ],
            contactPoint: {
                '@type': 'ContactPoint',
                telephone: '02-3144-3137',
                email: 'wow3d16@naver.com',
                contactType: 'customer service',
                areaServed: 'KR',
                availableLanguage: 'Korean',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': `${SITE_URL}#localbusiness`,
            name: '(주)와우쓰리디 (WOW3D)',
            description:
                '(주)와우쓰리디는 3D 프린팅 출력, 시제품 제작, 자동견적 서비스를 제공하는 서울 기반 업체입니다.',
            url: SITE_URL,
            image: absoluteUrl('/og-image-v2.jpg'),
            email: 'wow3d16@naver.com',
            telephone: '02-3144-3137',
            priceRange: '$$',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '독막로 93 상수빌딩 4층',
                addressLocality: '마포구',
                addressRegion: '서울',
                postalCode: '04044',
                addressCountry: 'KR',
            },
            geo: {
                '@type': 'GeoCoordinates',
                latitude: 37.5477,
                longitude: 126.9226,
            },
            openingHoursSpecification: [
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '09:00',
                    closes: '18:00',
                },
            ],
            areaServed: 'KR',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: '3D프린팅 출력 및 시제품제작',
            provider: {
                '@type': 'LocalBusiness',
                name: '(주)와우쓰리디 (WOW3D)',
            },
            areaServed: 'KR',
            description:
                '3D 프린팅 자동견적, FDM·SLA·DLP 출력, 시제품 제작, 소량 양산, 파일 검토와 납기 상담 서비스를 제공합니다.',
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'WOW3D 3D 프린팅 서비스',
                itemListElement: [
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '3D 프린팅 자동견적' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'FDM 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SLA 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'DLP 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '시제품 제작' } },
                ],
            },
        },
    ];
}
