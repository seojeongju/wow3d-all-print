import { getCloudflareContext } from '@opennextjs/cloudflare';
import { resolveGalleryImageUrl } from '@/lib/gallery-image-url';
import {
    PHOTO_TO_3D_SHOWCASE,
    type PhotoTo3DShowcaseItem,
} from '@/lib/seo-photo-to-3d';

type GalleryShowcaseRow = {
    title: string;
    description?: string | null;
    image_url: string;
    source_image_url: string;
    material?: string | null;
    print_method?: string | null;
};

function mapGalleryRowToShowcase(row: GalleryShowcaseRow): PhotoTo3DShowcaseItem {
    return {
        title: row.title,
        caption: row.description?.trim() || undefined,
        beforeSrc: resolveGalleryImageUrl(row.source_image_url),
        beforeAlt: `${row.title} 원본 사진 — 사진→AI 3D 입력`,
        afterSrc: resolveGalleryImageUrl(row.image_url),
        afterAlt: `${row.title} AI 3D·3D 프린팅 출력 결과`,
        printMethod: row.print_method?.trim() || undefined,
        material: row.material?.trim() || undefined,
    };
}

/** DB 갤러리(photo-to-3d 태그 + 원본 사진) → 쇼케이스. 없으면 정적 fallback */
export async function getPhotoTo3DShowcaseItems(): Promise<readonly PhotoTo3DShowcaseItem[]> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env?.DB) return PHOTO_TO_3D_SHOWCASE;

        const { results } = await env.DB.prepare(
            `SELECT title, description, image_url, source_image_url, material, print_method
             FROM gallery_items
             WHERE is_visible = 1
               AND source_image_url IS NOT NULL AND source_image_url != ''
               AND image_url IS NOT NULL AND image_url != ''
               AND (
                 tags LIKE '%photo-to-3d%'
                 OR tags LIKE '%photo_to_3d%'
                 OR tags LIKE '%phototo3d%'
               )
             ORDER BY sort_order DESC, created_at DESC
             LIMIT 6`
        ).all<GalleryShowcaseRow>();

        const mapped = (results ?? []).map(mapGalleryRowToShowcase);
        return mapped.length > 0 ? mapped : PHOTO_TO_3D_SHOWCASE;
    } catch (e) {
        console.warn('getPhotoTo3DShowcaseItems failed, using static fallback', e);
        return PHOTO_TO_3D_SHOWCASE;
    }
}

export function isPhotoTo3DGalleryTag(tags?: string | null): boolean {
    if (!tags) return false;
    try {
        const arr = JSON.parse(tags) as string[];
        return arr.some((t) => {
            const n = t.toLowerCase().replace(/[\s_]/g, '-');
            return n === 'photo-to-3d' || n === 'phototo3d' || t.includes('사진');
        });
    } catch {
        return tags.includes('photo-to-3d') || tags.includes('photo_to_3d');
    }
}
