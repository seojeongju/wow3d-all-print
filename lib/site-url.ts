/** 대표(canonical) 프로덕션 URL — www 고정 */
export const PRODUCTION_SITE_URL = 'https://www.wow3dp.co.kr';

/**
 * 네이버 검색 썸네일용 대표 이미지 (정사각 1200×1200).
 * - 네이버 SERP 썸네일은 정사각에 가깝게 잘림
 * - 파일명 버전(v2)으로 캐시·재수집 유도
 * - 로고/반복 배너가 아닌 제품 실사
 */
export const OG_IMAGE_PATH = '/og-naver-v2.jpg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 1200;

/** 소셜(카톡·FB 등) 가로형 보조 이미지 */
export const OG_IMAGE_WIDE_PATH = '/og-image-v2.jpg';
export const OG_IMAGE_WIDE_WIDTH = 1200;
export const OG_IMAGE_WIDE_HEIGHT = 630;

/**
 * 자동견적(/quote) 전용 OG — 홈과 URL을 분리해
 * 네이버가 페이지 고유 이미지로 채택하기 쉽게 함
 */
export const OG_QUOTE_IMAGE_PATH = '/og-quote-v1.jpg';
export const OG_QUOTE_IMAGE_WIDTH = 1200;
export const OG_QUOTE_IMAGE_HEIGHT = 630;

export const BRAND_LOGO_PATH = '/thumbnail.png';

export const SITE_TITLE =
    '3D프린팅출력 · 3D프린터출력 전문 | (주)와우쓰리디 WOW3D';
export const SITE_DESCRIPTION =
    '3D프린팅출력·3D프린터출력 전문 와우쓰리디. STL·OBJ·3MF·PLY 즉시 자동견적, STEP·STP 자동 변환. 시제품제작부터 소량생산까지.';
export const OG_IMAGE_ALT = '와우쓰리디 WOW3D 3D프린팅출력·3D프린터출력 시제품·산업용 부품';
export const OG_QUOTE_IMAGE_ALT =
    '와우쓰리디 WOW3D 3D프린팅 자동견적 — 파일 업로드 후 즉시 출력 가격 확인';

const LOCALHOST_RE = /^https?:\/\/localhost(:\d+)?(\/|$)/i;
const APEX_ORIGIN = 'https://wow3dp.co.kr';

/** apex → www 정규화 (환경변수 오설정 방어) */
function normalizeProductionOrigin(url: string): string {
    if (url === APEX_ORIGIN || url.startsWith(`${APEX_ORIGIN}/`)) {
        return url.replace(APEX_ORIGIN, PRODUCTION_SITE_URL);
    }
    return url.replace(/\/$/, '');
}

/** 빌드·런타임 공통 사이트 URL (OG·JSON-LD·canonical) */
export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (raw && !LOCALHOST_RE.test(raw)) {
        return normalizeProductionOrigin(raw.replace(/\/$/, ''));
    }
    if (process.env.NODE_ENV === 'production') {
        return PRODUCTION_SITE_URL;
    }
    return raw?.replace(/\/$/, '') || 'http://localhost:3000';
}

export const SITE_URL = getSiteUrl();

export function absoluteUrl(path: string): string {
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export type OgImageDescriptor = {
    url: string;
    width: number;
    height: number;
    alt: string;
    type: 'image/jpeg';
};

/** 홈·공통 페이지 OG 이미지 (정사각 우선 → 네이버 썸네일) */
export function buildOgImages(): OgImageDescriptor[] {
    return [
        {
            url: absoluteUrl(OG_IMAGE_PATH),
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
            alt: OG_IMAGE_ALT,
            type: 'image/jpeg',
        },
        {
            url: absoluteUrl(OG_IMAGE_WIDE_PATH),
            width: OG_IMAGE_WIDE_WIDTH,
            height: OG_IMAGE_WIDE_HEIGHT,
            alt: OG_IMAGE_ALT,
            type: 'image/jpeg',
        },
    ];
}

/** 자동견적 페이지 전용 OG (고유 URL) */
export function buildQuoteOgImages(): OgImageDescriptor[] {
    return [
        {
            url: absoluteUrl(OG_QUOTE_IMAGE_PATH),
            width: OG_QUOTE_IMAGE_WIDTH,
            height: OG_QUOTE_IMAGE_HEIGHT,
            alt: OG_QUOTE_IMAGE_ALT,
            type: 'image/jpeg',
        },
        {
            url: absoluteUrl(OG_IMAGE_PATH),
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
            alt: OG_IMAGE_ALT,
            type: 'image/jpeg',
        },
    ];
}

/**
 * OAuth redirect_uri — Google Cloud Console 등록값과 바이트 단위로 일치해야 함.
 * Host 헤더(workers.dev / apex)에 의존하지 않고 사이트 대표 URL을 사용한다.
 */
export function getOAuthRedirectUri(
    callbackPath: string,
    envOverride?: string | null
): string {
    const explicit = envOverride?.trim();
    if (explicit) {
        return normalizeProductionOrigin(explicit.replace(/\/$/, ''));
    }
    return absoluteUrl(callbackPath);
}
