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

/** 3D 프린팅 견적 요청 (파일 업로드 또는 사진 AI 3D) */
export function buildQuoteHowToSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '와우쓰리디 3D 프린팅 견적 받는 방법',
        description:
            '3D 모델 파일 업로드 또는 제품 사진 AI 3D 모델링 후 자동견적 → 가격·예상 제작기간 확인 → 주문·결제로 진행하는 3D 프린팅 견적·주문 절차입니다.',
        totalTime: 'PT15M',
        supply: [
            { '@type': 'HowToSupply', name: '3D 모델 파일 (STL, OBJ, 3MF, PLY, STEP, STP)' },
            { '@type': 'HowToSupply', name: '또는 제품 사진 (JPG, PNG)' },
        ],
        tool: [
            { '@type': 'HowToTool', name: '와우쓰리디 웹 자동견적 시스템' },
        ],
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: '파일 업로드 · 자동견적',
                text: 'STL·OBJ·3MF·PLY는 즉시 자동견적, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다. 3D 파일이 없으면 제품 사진(JPG/PNG)으로 AI 3D 모델을 생성할 수 있습니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: '가격 · 예상 제작기간 확인',
                text: '소재·출력 방식을 선택하면 가격이 실시간으로 반영됩니다. 검수·후처리 후 포장하여 발송하며, 평균 3~7일 내 수령 가능합니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: '주문 · 결제',
                text: '배송 정보를 입력하고 결제하면 주문이 접수됩니다. 이후 제작·검수·발송이 진행됩니다.',
                url: absoluteUrl('/checkout'),
            },
        ],
    };
}

export { buildPhotoTo3DHowToSchema } from '@/lib/seo-photo-to-3d';

/**
 * WebSite 스키마.
 * SearchAction은 /qna?q= 검색이 실제로 동작하지 않아 제거함 (잘못된 구조화 데이터 방지).
 */
export function buildWebSiteSearchActionSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '(주)와우쓰리디',
        alternateName: ['와우쓰리디', 'WOW3D', '와우3D'],
        url: SITE_URL,
        image: absoluteUrl('/og-naver-v1.jpg'),
        publisher: {
            '@type': 'Organization',
            name: '(주)와우쓰리디',
            logo: {
                '@type': 'ImageObject',
                url: absoluteUrl('/thumbnail.png'),
            },
        },
    };
}

/** 홈·대표 페이지용 — 네이버가 썸네일로 쓸 primaryImageOfPage */
export function buildWebPageSchema(input?: {
    name?: string;
    description?: string;
    path?: string;
}) {
    const path = input?.path ?? '/';
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: input?.name ?? '3D프린팅출력 · 3D프린터출력 전문 | (주)와우쓰리디 WOW3D',
        description:
            input?.description ??
            '3D프린팅출력·3D프린터출력 전문 와우쓰리디. STL·OBJ·3MF·PLY 즉시 자동견적, STEP·STP 자동 변환. 시제품제작부터 소량생산까지.',
        url: absoluteUrl(path),
        isPartOf: { '@type': 'WebSite', url: SITE_URL, name: '(주)와우쓰리디' },
        primaryImageOfPage: {
            '@type': 'ImageObject',
            url: absoluteUrl('/og-naver-v1.jpg'),
            width: 1200,
            height: 1200,
            caption: '와우쓰리디 WOW3D 3D프린팅출력·3D프린터출력 시제품·산업용 부품',
        },
        image: absoluteUrl('/og-naver-v1.jpg'),
        inLanguage: 'ko-KR',
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
            image: [
                absoluteUrl('/og-naver-v1.jpg'),
                absoluteUrl('/og-image-v2.jpg'),
            ],
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
                '(주)와우쓰리디는 3D프린팅출력, 3D프린터출력, 시제품 제작, 자동견적 서비스를 제공하는 서울 기반 업체입니다.',
            url: SITE_URL,
            image: [
                absoluteUrl('/og-naver-v1.jpg'),
                absoluteUrl('/og-image-v2.jpg'),
            ],
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
            serviceType: '3D프린팅출력 및 3D프린터출력 · 시제품제작',
            provider: {
                '@type': 'LocalBusiness',
                name: '(주)와우쓰리디 (WOW3D)',
            },
            areaServed: 'KR',
            description:
                '3D프린팅출력·3D프린터출력 자동견적, FDM·SLA·DLP 출력, 시제품 제작, 소량 양산, 파일 검토와 납기 상담 서비스를 제공합니다.',
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'WOW3D 3D 프린팅 서비스',
                itemListElement: [
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '3D프린팅출력 자동견적' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '3D프린터출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'FDM 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SLA 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'DLP 출력 서비스' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '시제품 제작' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '사진 AI 3D 모델링 · 자동견적' } },
                ],
            },
        },
    ];
}
