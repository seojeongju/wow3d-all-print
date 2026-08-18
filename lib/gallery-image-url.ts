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
