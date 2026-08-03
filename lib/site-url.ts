/** 대표(canonical) 프로덕션 URL — www 고정 */
export const PRODUCTION_SITE_URL = 'https://www.wow3dp.co.kr';

/** 네이버 썸네일용 — 텍스트 없는 제품 사진 (URL 변경으로 캐시 갱신) */
export const OG_IMAGE_PATH = '/og-image-v2.jpg';
export const BRAND_LOGO_PATH = '/thumbnail.png';

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
