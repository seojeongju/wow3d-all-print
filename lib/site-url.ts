export const PRODUCTION_SITE_URL = 'https://wow3dp.co.kr';

/** 네이버 썸네일용 — 텍스트 없는 제품 사진 (URL 변경으로 캐시 갱신) */
export const OG_IMAGE_PATH = '/og-image-v2.jpg';
export const BRAND_LOGO_PATH = '/thumbnail.png';

const LOCALHOST_RE = /^https?:\/\/localhost(:\d+)?(\/|$)/i;

/** 빌드·런타임 공통 사이트 URL (OG·JSON-LD·canonical) */
export function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (raw && !LOCALHOST_RE.test(raw)) {
        return raw.replace(/\/$/, '');
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
