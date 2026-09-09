import { getCloudflareContext } from '@opennextjs/cloudflare';
import { isPhotoTo3DGalleryTag } from '@/lib/photo-to-3d-showcase';
import {
    buildGalleryImageUrls,
    loadGalleryExtraImagesByItemIds,
    type GalleryImagePublic,
} from '@/lib/gallery-images';

export type PublicGalleryItem = {
    id: string | number;
    title: string;
    description?: string;
    image_url: string;
    /** 대표 + 추가 이미지 (자세히 보기 캐러셀용) */
    images?: string[];
    /** 관리자 편집용 추가 이미지 메타 */
    extra_images?: GalleryImagePublic[];
    source_image_url?: string | null;
    material?: string | null;
    print_method?: string | null;
    tags?: string;
    created_at: string;
};

export type PublicGalleryResult = {
    items: PublicGalleryItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
};

type GalleryDbRow = PublicGalleryItem & { id: number };

function cleanText(text: string) {
    if (!text) return '';
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

async function attachExtraImages(items: PublicGalleryItem[]): Promise<PublicGalleryItem[]> {
    const numericIds = items
        .map((it) => (typeof it.id === 'number' ? it.id : Number(it.id)))
        .filter((id) => Number.isFinite(id) && id > 0);

    if (numericIds.length === 0) {
        return items.map((it) => ({
            ...it,
            images: buildGalleryImageUrls(it.image_url, undefined),
        }));
    }

    try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env?.DB) {
            return items.map((it) => ({
                ...it,
                images: buildGalleryImageUrls(it.image_url, undefined),
            }));
        }

        const map = await loadGalleryExtraImagesByItemIds(env.DB, numericIds);
        return items.map((it) => {
            const nid = typeof it.id === 'number' ? it.id : Number(it.id);
            const extras = Number.isFinite(nid) ? map.get(nid) : undefined;
            return {
                ...it,
                extra_images: extras,
                images: buildGalleryImageUrls(it.image_url, extras),
            };
        });
    } catch (e) {
        console.warn('attachExtraImages', e);
        return items.map((it) => ({
            ...it,
            images: buildGalleryImageUrls(it.image_url, undefined),
        }));
    }
}

async function fetchRemoteGalleryItems(): Promise<PublicGalleryItem[]> {
    try {
        const remotePageLimit = 30;
        const remotePagesToFetch = 5;
        const pageUrls = Array.from({ length: remotePagesToFetch }, (_, i) =>
            `https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=${remotePageLimit}&page=${i + 1}`
        );
        const pageResponses = await Promise.all(
            pageUrls.map((u) =>
                fetch(u, { cache: 'no-store' })
                    .then((r) => r.json())
                    .catch(() => ({ data: [] }))
            )
        );
        const allPosts: any[] = pageResponses.flatMap((r) => r.data || []);

        return allPosts
            .map((post: any) => {
                const remoteImages: string[] = Array.isArray(post.images)
                    ? post.images.filter((i: string) => i && String(i).startsWith('http'))
                    : [];
                const img = remoteImages[0] || '';
                if (!img) return null;

                let method: string | null = null;
                const searchStr = ((post.title || '') + ' ' + (post.content || '')).toUpperCase();
                if (searchStr.includes('FDM')) method = 'FDM';
                else if (searchStr.includes('SLA')) method = 'SLA';
                else if (searchStr.includes('DLP') || searchStr.includes('MSLA')) method = 'DLP';

                const item: PublicGalleryItem = {
                    id: `remote_${post.id}`,
                    title: cleanText(post.title || '무제'),
                    description: cleanText(post.content || '').substring(0, 150),
                    image_url: img,
                    images: remoteImages.length > 0 ? remoteImages : [img],
                    material: null,
                    print_method: method,
                    tags: '[]',
                    created_at: String(post.created_at || ''),
                };
                return item;
            })
            .filter((item): item is PublicGalleryItem => item !== null);
    } catch (err) {
        console.error('Remote gallery fetch error:', err);
        return [];
    }
}

/** 공개 갤러리 목록 (SSR·API 공통) */
export async function getPublicGallery(options?: {
    page?: number;
    limit?: number;
    storeId?: number | null;
    tag?: 'photo-to-3d' | null;
}): Promise<PublicGalleryResult> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(50, Math.max(4, options?.limit ?? 8));
    const storeId = options?.storeId ?? null;
    const offset = (page - 1) * limit;

    let localItems: PublicGalleryItem[] = [];

    try {
        const { env } = await getCloudflareContext({ async: true });
        if (env?.DB) {
            let whereClause = 'WHERE is_visible = 1';
            const params: (string | number)[] = [];
            if (storeId != null) {
                whereClause += ' AND store_id = ?';
                params.push(storeId);
            }

            const rows = await env.DB.prepare(
                `SELECT * FROM gallery_items
                 ${whereClause}
                 ORDER BY created_at DESC, sort_order DESC`
            )
                .bind(...params)
                .all();

            localItems = ((rows.results as GalleryDbRow[]) || []);

            if (localItems.length === 0 && storeId != null) {
                const fallbackRows = await env.DB.prepare(
                    `SELECT * FROM gallery_items WHERE is_visible = 1 ORDER BY created_at DESC`
                ).all();
                localItems = ((fallbackRows.results as GalleryDbRow[]) || []);
            }

            localItems = await attachExtraImages(localItems);
        }
    } catch (dbErr) {
        console.error('Local DB gallery fetch error:', dbErr);
    }

    const remoteItems = options?.tag === 'photo-to-3d'
        ? []
        : await fetchRemoteGalleryItems();
    const localIds = new Set(localItems.map((it) => String(it.id)));
    let merged = [...localItems, ...remoteItems.filter((r) => !localIds.has(String(r.id)))];

    if (options?.tag === 'photo-to-3d') {
        merged = merged.filter(
            (item) =>
                isPhotoTo3DGalleryTag(item.tags) &&
                Boolean(item.source_image_url?.trim())
        );
    }

    merged.sort((a, b) => {
        const ta = a.created_at ? String(a.created_at).replace(' ', 'T') : '0';
        const tb = b.created_at ? String(b.created_at).replace(' ', 'T') : '0';
        return tb.localeCompare(ta);
    });

    const total = merged.length;
    return {
        items: merged.slice(offset, offset + limit),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
}

/** 공개 갤러리 단일 항목 (딥링크·홈 슬라이더 클릭용) */
export async function getPublicGalleryItemById(
    id: string | number
): Promise<PublicGalleryItem | null> {
    const idStr = String(id).trim();
    if (!idStr) return null;

    try {
        const { env } = await getCloudflareContext({ async: true });
        if (env?.DB && /^\d+$/.test(idStr)) {
            const row = await env.DB.prepare(
                `SELECT * FROM gallery_items WHERE id = ? AND is_visible = 1`
            )
                .bind(Number(idStr))
                .first<GalleryDbRow>();
            if (row) {
                const [withImages] = await attachExtraImages([row]);
                return withImages;
            }
        }
    } catch (dbErr) {
        console.error('getPublicGalleryItemById DB error:', dbErr);
    }

    if (idStr.startsWith('remote_')) {
        const remoteItems = await fetchRemoteGalleryItems();
        return remoteItems.find((r) => String(r.id) === idStr) ?? null;
    }

    const all = await getPublicGallery({ page: 1, limit: 50 });
    return all.items.find((item) => String(item.id) === idStr) ?? null;
}
