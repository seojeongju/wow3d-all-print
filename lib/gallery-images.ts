import { resolveGalleryImageUrl } from '@/lib/gallery-image-url';

export type GalleryImageRow = {
    id: number;
    gallery_item_id: number;
    r2_key: string;
    mime_type?: string | null;
    sort_order: number;
};

export type GalleryImagePublic = {
    id?: number;
    url: string;
    r2_key?: string;
    sort_order?: number;
};

type D1Like = {
    prepare: (query: string) => {
        bind: (...args: unknown[]) => {
            all: () => Promise<{ results?: unknown[] }>;
            first: <T>() => Promise<T | null>;
            run: () => Promise<{ meta?: { last_row_id?: number } }>;
        };
        all: () => Promise<{ results?: unknown[] }>;
    };
};

/** R2 키 → 표시 URL */
export function galleryImageDisplayUrl(r2Key: string): string {
    return resolveGalleryImageUrl(r2Key);
}

/**
 * 항목들의 추가 이미지를 일괄 조회해 Map으로 반환.
 * 테이블이 없으면 빈 Map (마이그레이션 전 호환).
 */
export async function loadGalleryExtraImagesByItemIds(
    db: D1Like,
    itemIds: number[]
): Promise<Map<number, GalleryImagePublic[]>> {
    const map = new Map<number, GalleryImagePublic[]>();
    const ids = [...new Set(itemIds.filter((id) => Number.isFinite(id) && id > 0))];
    if (ids.length === 0) return map;

    try {
        const placeholders = ids.map(() => '?').join(',');
        const res = await db
            .prepare(
                `SELECT id, gallery_item_id, r2_key, mime_type, sort_order
                 FROM gallery_item_images
                 WHERE gallery_item_id IN (${placeholders})
                 ORDER BY sort_order ASC, id ASC`
            )
            .bind(...ids)
            .all();

        for (const row of (res.results as GalleryImageRow[]) || []) {
            const list = map.get(row.gallery_item_id) || [];
            list.push({
                id: row.id,
                url: galleryImageDisplayUrl(row.r2_key),
                r2_key: row.r2_key,
                sort_order: row.sort_order,
            });
            map.set(row.gallery_item_id, list);
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes('no such table')) {
            console.warn('loadGalleryExtraImagesByItemIds', e);
        }
    }

    return map;
}

/**
 * 대표 image_url + 추가 이미지를 합친 URL/키 배열 (표시용 resolve는 클라이언트에서).
 * source_image_url(Before)은 포함하지 않음.
 */
export function buildGalleryImageUrls(
    coverUrl: string | null | undefined,
    extras: GalleryImagePublic[] | undefined
): string[] {
    const urls: string[] = [];
    const seen = new Set<string>();
    const push = (raw: string | null | undefined) => {
        if (!raw?.trim()) return;
        const key = resolveGalleryImageUrl(raw);
        if (seen.has(key)) return;
        seen.add(key);
        urls.push(raw);
    };
    push(coverUrl);
    for (const extra of extras || []) {
        push(extra.r2_key || extra.url);
    }
    return urls;
}

/** 추가 이미지 INSERT (다음 sort_order) */
export async function insertGalleryExtraImage(
    db: D1Like,
    galleryItemId: number,
    r2Key: string,
    mimeType: string | null
): Promise<number | undefined> {
    const maxSort = await db
        .prepare(
            `SELECT COALESCE(MAX(sort_order), -1) as m FROM gallery_item_images WHERE gallery_item_id = ?`
        )
        .bind(galleryItemId)
        .first<{ m: number }>();
    const sortOrder = (maxSort?.m ?? -1) + 1;
    const ins = await db
        .prepare(
            `INSERT INTO gallery_item_images (gallery_item_id, r2_key, mime_type, sort_order)
             VALUES (?, ?, ?, ?)`
        )
        .bind(galleryItemId, r2Key, mimeType, sortOrder)
        .run();
    return ins.meta?.last_row_id;
}
