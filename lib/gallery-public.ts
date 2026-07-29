import { getCloudflareContext } from '@opennextjs/cloudflare';

export type PublicGalleryItem = {
    id: string | number;
    title: string;
    description?: string;
    image_url: string;
    material?: string | null;
    print_method?: string | null;
    tags?: string;
    created_at: string;
};

export type PublicGalleryResult = {
    items: PublicGalleryItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
};

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
                const img =
                    post.images?.find((i: string) => i && i.startsWith('http')) || '';
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

            localItems = ((rows.results as PublicGalleryItem[]) || []);

            if (localItems.length === 0 && storeId != null) {
                const fallbackRows = await env.DB.prepare(
                    `SELECT * FROM gallery_items WHERE is_visible = 1 ORDER BY created_at DESC`
                ).all();
                localItems = ((fallbackRows.results as PublicGalleryItem[]) || []);
            }
        }
    } catch (dbErr) {
        console.error('Local DB gallery fetch error:', dbErr);
    }

    const remoteItems = await fetchRemoteGalleryItems();
    const localIds = new Set(localItems.map((it) => String(it.id)));
    const merged = [...localItems, ...remoteItems.filter((r) => !localIds.has(String(r.id)))];

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
