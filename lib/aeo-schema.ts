import type { QnAItem } from '@/lib/qna';
import {
    absoluteUrl,
    OG_IMAGE_ALT,
    OG_IMAGE_HEIGHT,
    OG_IMAGE_PATH,
    OG_IMAGE_WIDE_PATH,
    OG_IMAGE_WIDTH,
    SITE_URL,
} from '@/lib/site-url';
import { getContentDates, kstDateToIso } from '@/lib/content-dates';
import { MAKERSPACES, type Makerspace } from '@/lib/makerspaces';

/**
 * 엔티티 고정 @id — 모든 페이지의 스키마가 같은 회사·사이트·사업장을 가리키도록 참조로 연결한다.
 * (AI·검색엔진이 흩어진 스키마를 하나의 회사로 인식하게 하는 핵심)
 */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const HQ_LOCALBUSINESS_ID = `${SITE_URL}/#localbusiness`;

const ORG_REF = { '@id': ORG_ID };
const WEBSITE_REF = { '@id': WEBSITE_ID };

const ORG_NAME = '(주)와우쓰리디';
const ORG_EMAIL = 'wow3d16@naver.com';
const ORG_TELEPHONE = '02-3144-3137';
const LOGO_URL = absoluteUrl('/thumbnail.png');

/** 회사 전문 분야 — AI가 "무엇을 하는 회사인지" 연결할 때 쓰는 주제어 */
const KNOWS_ABOUT = [
    '3D 프린팅',
    '3D프린팅 출력 대행',
    '3D프린팅 자동견적',
    'FDM 3D 프린팅',
    'SLA 3D 프린팅',
    'DLP 3D 프린팅',
    '시제품 제작',
    '소량 양산',
    '3D 모델링',
    'STL 파일 리페어',
    '사진 기반 AI 3D 모델링',
    '캡스톤디자인 시제품',
];

/**
 * 회사와 같은 엔티티임을 알리는 공식 외부 프로필.
 * 옛 브랜드(3D쿠키·3D팹카페) 계정은 다른 엔티티로 오인될 수 있어 넣지 않는다 (푸터 링크와는 별개).
 * 와우쓰리디 이름의 공식 채널(네이버 플레이스 등)이 생기면 여기에 추가.
 */
const SAME_AS: string[] = [];

/** 가이드 저자 — (주)와우쓰리디 대표 */
export const CEO_PERSON_ID = `${SITE_URL}/#ceo`;
const CEO_REF = { '@id': CEO_PERSON_ID };

export function buildCeoPersonSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': CEO_PERSON_ID,
        name: '서정주',
        jobTitle: '대표',
        worksFor: ORG_REF,
        knowsAbout: KNOWS_ABOUT,
    };
}

const WEEKDAY_HOURS = [
    {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
    },
];

function localBusinessId(center: Makerspace) {
    return center.id === 'hongdae' ? HQ_LOCALBUSINESS_ID : `${SITE_URL}/#localbusiness-${center.id}`;
}

/** 제작센터(메이커스페이스) 1곳의 LocalBusiness — 홍대센터가 본점 */
export function buildMakerspaceLocalBusiness(center: Makerspace) {
    const isHq = center.id === 'hongdae';
    return {
        '@type': 'LocalBusiness',
        '@id': localBusinessId(center),
        name: `(주)와우쓰리디 WOW3D ${center.name}`,
        description: isHq
            ? '(주)와우쓰리디 본점. 3D프린팅출력, 3D프린터출력, 시제품 제작, 자동견적 서비스를 제공하는 서울 마포구(홍대·상수) 제작센터입니다.'
            : `(주)와우쓰리디 ${center.name}. 3D프린팅 출력·시제품 제작 상담을 제공하는 ${center.label} 제작센터입니다.`,
        url: absoluteUrl('/makerspace'),
        image: [absoluteUrl(OG_IMAGE_PATH), absoluteUrl(OG_IMAGE_WIDE_PATH)],
        email: ORG_EMAIL,
        ...(center.phone ? { telephone: center.phone } : {}),
        priceRange: '$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: center.addressDetail ? `${center.address} ${center.addressDetail}` : center.address,
            addressCountry: 'KR',
            ...(isHq ? { addressLocality: '마포구', addressRegion: '서울', postalCode: '04044' } : {}),
        },
        geo: { '@type': 'GeoCoordinates', latitude: center.lat, longitude: center.lng },
        hasMap: `https://map.kakao.com/link/map/${encodeURIComponent(center.name)},${center.lat},${center.lng}`,
        openingHoursSpecification: WEEKDAY_HOURS,
        areaServed: 'KR',
        parentOrganization: ORG_REF,
    };
}

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
            '3D 모델 파일 업로드 또는 제품 사진(이미지) AI 3D 모델링 후 자동견적 → 가격·예상 제작기간 확인 → 주문·결제로 진행하는 3D 프린팅 견적·주문 절차입니다.',
        totalTime: 'PT15M',
        supply: [
            { '@type': 'HowToSupply', name: '3D 모델 파일 (STL, OBJ, 3MF, PLY, STEP, STP)' },
            { '@type': 'HowToSupply', name: '또는 제품 사진(이미지) (JPG, PNG)' },
        ],
        tool: [
            { '@type': 'HowToTool', name: '와우쓰리디 웹 자동견적 시스템' },
        ],
        step: [
            {
                '@type': 'HowToStep',
                position: 1,
                name: '파일 업로드 · 자동견적',
                text: 'STL·OBJ·3MF·PLY는 즉시 자동견적, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다. 3D 파일이 없으면 제품 사진(이미지)(JPG/PNG)으로 AI 3D 모델을 생성할 수 있습니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 2,
                name: '파일 자동 점검 · 리페어',
                text: 'STL·OBJ·PLY 파일의 구멍·틈·중복 면 같은 메쉬 오류는 업로드 즉시 브라우저에서 자동 리페어해 견적하며, 원본 파일로 되돌릴 수 있습니다. 벽 두께도 측정해 FDM 1mm, SLA·DLP 0.6mm보다 얇은 부분은 경고와 함께 3D 뷰어에 표시합니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 3,
                name: '가격 · 예상 제작기간 확인',
                text: '소재·출력 방식을 선택하면 가격이 실시간으로 반영됩니다. 검수·후처리 후 포장하여 발송하며, 평균 3~7일 내 수령 가능합니다.',
                url: absoluteUrl('/quote'),
            },
            {
                '@type': 'HowToStep',
                position: 4,
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
        '@id': WEBSITE_ID,
        name: ORG_NAME,
        alternateName: ['와우쓰리디', 'WOW3D', '와우3D', '와우쓰리디 3D프린팅'],
        url: SITE_URL,
        image: absoluteUrl(OG_IMAGE_PATH),
        inLanguage: ['ko-KR', 'en'],
        publisher: ORG_REF,
    };
}

/** 홈·대표 페이지용 — 네이버가 썸네일로 쓸 primaryImageOfPage */
export function buildWebPageSchema(input?: {
    name?: string;
    description?: string;
    path?: string;
    imagePath?: string;
    imageWidth?: number;
    imageHeight?: number;
    imageCaption?: string;
    locale?: string;
}) {
    const path = input?.path ?? '/';
    const imagePath = input?.imagePath ?? OG_IMAGE_PATH;
    const imageUrl = absoluteUrl(imagePath);
    const width = input?.imageWidth ?? OG_IMAGE_WIDTH;
    const height = input?.imageHeight ?? OG_IMAGE_HEIGHT;
    const caption = input?.imageCaption ?? OG_IMAGE_ALT;

    const url = absoluteUrl(path);
    const dates = getContentDates(path);

    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: input?.name ?? '3D프린팅출력 · 3D프린터출력 전문 | (주)와우쓰리디 WOW3D',
        description:
            input?.description ??
            '3D프린팅출력·3D프린터출력 전문 와우쓰리디. STL·OBJ·3MF·PLY 즉시 자동견적, STEP·STP 자동 변환. 시제품제작부터 소량생산까지.',
        url,
        isPartOf: WEBSITE_REF,
        about: ORG_REF,
        publisher: ORG_REF,
        primaryImageOfPage: {
            '@type': 'ImageObject',
            url: imageUrl,
            width,
            height,
            caption,
        },
        image: imageUrl,
        inLanguage: input?.locale === 'en' ? 'en' : 'ko-KR',
        ...(dates
            ? { datePublished: kstDateToIso(dates.published), dateModified: kstDateToIso(dates.modified) }
            : {}),
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
    imagePath?: string;
}) {
    const imageUrl = absoluteUrl(input.imagePath ?? OG_IMAGE_PATH);
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: input.name,
        description: input.description,
        url: absoluteUrl(input.path),
        image: imageUrl,
        primaryImageOfPage: {
            '@type': 'ImageObject',
            url: imageUrl,
        },
    };
}

/** 맞춤 상품 가격 범위 (VAT 포함, 옵션·수량에 따라 맞춤 견적) — 상품별로 달라지면 상품 데이터로 옮길 것 */
export const CUSTOM_PRODUCT_PRICE_RANGE_KRW = { low: 8000, high: 12000 } as const;

/**
 * 맞춤 상품 상세.
 * 고정가가 없는 견적형 상품은 가격 없는 Offer를 넣으면 Google에서 "가격 누락" 오류가 나므로
 * lowPrice(최저 견적가)가 있을 때만 AggregateOffer를 넣고, 없으면 견적 안내를 속성으로만 표시한다.
 */
export function buildCustomProductSchema(input: {
    name: string;
    description: string;
    path: string;
    imageUrls: string[];
    priceNote?: string;
    brandName?: string;
    sku?: string;
    lowPrice?: number;
    highPrice?: number;
}) {
    const images = (input.imageUrls.length > 0 ? input.imageUrls : [absoluteUrl(OG_IMAGE_PATH)]).map(
        (src) => (src.startsWith('http') ? src : absoluteUrl(src))
    );
    const url = absoluteUrl(input.path);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: input.name,
        description: input.description,
        image: images,
        sku: input.sku || undefined,
        brand: {
            '@type': 'Brand',
            name: input.brandName || 'WOW3D',
        },
        manufacturer: ORG_REF,
        category: '3D Printing Custom Product',
        additionalProperty: [
            { '@type': 'PropertyValue', name: '가격 안내', value: input.priceNote || '맞춤 견적가' },
        ],
        ...(input.lowPrice && input.lowPrice > 0
            ? {
                  offers: {
                      '@type': 'AggregateOffer',
                      url,
                      priceCurrency: 'KRW',
                      lowPrice: input.lowPrice,
                      ...(input.highPrice && input.highPrice >= input.lowPrice
                          ? { highPrice: input.highPrice }
                          : {}),
                      availability: 'https://schema.org/InStock',
                      itemCondition: 'https://schema.org/NewCondition',
                      seller: ORG_REF,
                  },
              }
            : {}),
        url,
    };
}

/** 맞춤 상품 허브 ItemList */
export function buildCustomProductItemListSchema(
    items: Array<{ name: string; path: string; imageUrl?: string }>,
    listPath = '/custom'
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: absoluteUrl(listPath),
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            url: absoluteUrl(item.path),
            ...(item.imageUrl
                ? {
                      image: item.imageUrl.startsWith('http')
                          ? item.imageUrl
                          : absoluteUrl(item.imageUrl),
                  }
                : {}),
        })),
    };
}

/**
 * 가이드·활용 사례 Article.
 * 작성일·수정일은 lib/content-dates.ts에서 경로로 찾아 넣는다 (AI 답변이 최신성·출처를 판단하는 신호).
 */
export function buildArticleSchema(input: {
    headline: string;
    description: string;
    path: string;
    imagePath?: string;
    locale?: string;
}) {
    const url = absoluteUrl(input.path);
    const dates = getContentDates(input.path);
    const image = input.imagePath
        ? input.imagePath.startsWith('http')
            ? input.imagePath
            : absoluteUrl(input.imagePath)
        : absoluteUrl(OG_IMAGE_PATH);

    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: input.headline,
        description: input.description,
        image,
        inLanguage: input.locale === 'en' || input.path.startsWith('/en/') ? 'en' : 'ko-KR',
        author: CEO_REF,
        publisher: ORG_REF,
        isPartOf: WEBSITE_REF,
        mainEntityOfPage: url,
        url,
        ...(dates
            ? { datePublished: kstDateToIso(dates.published), dateModified: kstDateToIso(dates.modified) }
            : {}),
    };
}

/** 회사(Organization) — 3개 제작센터를 하위 사업장으로 연결 */
export function buildOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': ORG_ID,
        name: ORG_NAME,
        legalName: ORG_NAME,
        alternateName: ['WOW3D', '와우쓰리디', '와우3D', 'WOW3D Co., Ltd.'],
        description:
            '(주)와우쓰리디(WOW3D)는 3D 파일·사진 업로드 자동견적부터 FDM·SLA·DLP 3D프린팅 출력, 시제품 제작, 소량 양산, 3D 모델링까지 제공하는 한국의 3D프린팅 전문 기업입니다.',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        image: [absoluteUrl(OG_IMAGE_PATH), absoluteUrl(OG_IMAGE_WIDE_PATH)],
        email: ORG_EMAIL,
        telephone: ORG_TELEPHONE,
        address: {
            '@type': 'PostalAddress',
            streetAddress: '독막로 93 상수빌딩 4층',
            addressLocality: '마포구',
            addressRegion: '서울',
            postalCode: '04044',
            addressCountry: 'KR',
        },
        knowsAbout: KNOWS_ABOUT,
        areaServed: 'KR',
        ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
        subOrganization: MAKERSPACES.map((c) => ({ '@id': localBusinessId(c) })),
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: ORG_TELEPHONE,
            email: ORG_EMAIL,
            contactType: 'customer service',
            areaServed: 'KR',
            availableLanguage: ['Korean', 'English'],
        },
    };
}

export function buildBusinessSchemas() {
    const hq = MAKERSPACES.find((c) => c.id === 'hongdae') ?? MAKERSPACES[0];
    return [
        buildOrganizationSchema(),
        { '@context': 'https://schema.org', ...buildMakerspaceLocalBusiness(hq) },
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${SITE_URL}/#service`,
            serviceType: '3D프린팅출력 및 3D프린터출력 · 시제품제작',
            provider: ORG_REF,
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
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '사진(이미지) AI 3D 모델링 · 자동견적' } },
                ],
            },
        },
    ];
}
