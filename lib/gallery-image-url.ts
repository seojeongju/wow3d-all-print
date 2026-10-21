/** 갤러리·쇼케이스 이미지 URL 정규화 (R2 key → API 경로) */

const PLACEHOLDER_DATA_URI =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="%231e1e2e"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%234d4d66" font-size="14" font-family="sans-serif">이미지 없음</text></svg>';

export function resolveGalleryImageUrl(url: string): string {
    if (!url || typeof url !== 'string' || !url.trim()) return PLACEHOLDER_DATA_URI;
    if (url === '/placeholder-3d.jpg' || url.endsWith('placeholder-3d.jpg') || url.includes('placeholder')) {
        return '/placeholder-3d.svg';
    }
    if (url.startsWith('http')) return url;
    if (url.startsWith('/data/file/')) return `http://3dcookiehd.co.kr${url}`;
    if (url.startsWith('data/file/')) return `http://3dcookiehd.co.kr/${url}`;
    if (url.startsWith('/')) return url;
    if (url.startsWith('gallery/')) {
        return `/api/gallery/image/${url.replace(/^gallery\//, '')}`;
    }
    return `/api/files/${url}`;
}

/** 갤러리 썸네일 너비(px) — 이미지 API가 이 값만 축소 WebP로 변환한다 */
export const GALLERY_THUMB_WIDTHS = [480, 960, 1600] as const;
export type GalleryThumbWidth = (typeof GALLERY_THUMB_WIDTHS)[number];

/** R2 갤러리 이미지면 축소 WebP 썸네일 URL, 그 밖의 이미지는 원래 URL */
export function resolveGalleryThumbUrl(url: string, width: GalleryThumbWidth): string {
    const resolved = resolveGalleryImageUrl(url);
    return resolved.startsWith('/api/gallery/image/') ? `${resolved}?w=${width}` : resolved;
}

/** 카드용 srcSet (갤러리 R2 이미지일 때만) */
export function galleryThumbSrcSet(url: string): string | undefined {
    const resolved = resolveGalleryImageUrl(url);
    if (!resolved.startsWith('/api/gallery/image/')) return undefined;
    return `${resolved}?w=480 480w, ${resolved}?w=960 960w`;
}
