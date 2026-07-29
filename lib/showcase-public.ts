import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
    SHOWCASE_DEFAULTS,
    SHOWCASE_SLUGS,
    defaultsForSlug,
    parseFeaturesJson,
    showcaseMediaUrlFromKey,
    type ShowcaseSlug,
} from '@/lib/showcase';

const DEFAULT_STORE_ID = 1;

export type ShowcaseCategoryCard = {
    slug: ShowcaseSlug;
    title: string;
    description: string;
    features: string[];
    cardImageUrl: string;
};

export type ShowcaseMediaItem = {
    id: number;
    kind: string;
    url: string;
    mimeType: string | null;
};

export type ShowcaseExample = {
    id: number;
    title: string;
    description: string | null;
    features: string[];
    media: ShowcaseMediaItem[];
};

export type ShowcaseDetail = {
    slug: ShowcaseSlug;
    title: string;
    description: string;
    features: string[];
    heroImageUrl: string;
    examples: ShowcaseExample[];
};

export function buildFallbackShowcaseCards(): ShowcaseCategoryCard[] {
    return SHOWCASE_DEFAULTS.map((d) => ({
        slug: d.slug,
        title: d.defaultTitle,
        description: d.defaultDescription,
        features: d.defaultFeatures,
        cardImageUrl: d.fallbackImage,
    }));
}

/** /expert 카드용 카테고리 목록 */
export async function getShowcaseCategories(): Promise<ShowcaseCategoryCard[]> {
    const storeId = DEFAULT_STORE_ID;
    const rows: Record<string, Record<string, unknown>> = {};

    try {
        const { env } = await getCloudflareContext({ async: true });
        if (env?.DB) {
            const res = await env.DB.prepare(
                `SELECT category_slug, title, description, features_json, card_image_key
                 FROM showcase_category_content WHERE store_id = ?`
            )
                .bind(storeId)
                .all();
            for (const r of (res.results as Record<string, unknown>[]) || []) {
                rows[r.category_slug as string] = r;
            }
        }
    } catch (e) {
        console.warn('getShowcaseCategories DB error', e);
    }

    return SHOWCASE_SLUGS.map((slug) => {
        const def = defaultsForSlug(slug)!;
        const row = rows[slug];
        const title = (row?.title as string)?.trim() || def.defaultTitle;
        const description = (row?.description as string)?.trim() || def.defaultDescription;
        const features = row?.features_json
            ? parseFeaturesJson(row.features_json as string)
            : def.defaultFeatures;
        const cardKey = (row?.card_image_key as string)?.trim() || '';
        const cardImageUrl = cardKey ? showcaseMediaUrlFromKey(cardKey) : def.fallbackImage;
        return { slug, title, description, features, cardImageUrl };
    });
}

/** 카테고리 상세 + 제작 예시 (SSR용) */
export async function getShowcaseDetail(slug: ShowcaseSlug): Promise<ShowcaseDetail> {
    const def = defaultsForSlug(slug)!;
    let title = def.defaultTitle;
    let description = def.defaultDescription;
    let features = def.defaultFeatures;
    let heroImageUrl = def.fallbackImage;
    const examples: ShowcaseExample[] = [];
    const storeId = DEFAULT_STORE_ID;

    try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env?.DB) {
            return { slug, title, description, features, heroImageUrl, examples };
        }

        const row = await env.DB.prepare(
            `SELECT title, description, features_json, card_image_key
             FROM showcase_category_content WHERE store_id = ? AND category_slug = ?`
        )
            .bind(storeId, slug)
            .first<{
                title: string | null;
                description: string | null;
                features_json: string | null;
                card_image_key: string | null;
            }>();

        if (row) {
            if (row.title?.trim()) title = row.title.trim();
            if (row.description?.trim()) description = row.description.trim();
            if (row.features_json && parseFeaturesJson(row.features_json).length) {
                features = parseFeaturesJson(row.features_json);
            }
            if (row.card_image_key?.trim()) {
                heroImageUrl = showcaseMediaUrlFromKey(row.card_image_key.trim());
            }
        }

        const exRows = await env.DB.prepare(
            `SELECT id, title, description, features_json, sort_order
             FROM showcase_examples
             WHERE store_id = ? AND category_slug = ? AND is_visible = 1
             ORDER BY sort_order ASC, id ASC`
        )
            .bind(storeId, slug)
            .all();

        for (const ex of (exRows.results as Record<string, unknown>[]) || []) {
            const id = ex.id as number;
            const mediaRes = await env.DB.prepare(
                `SELECT id, kind, r2_key, mime_type, sort_order
                 FROM showcase_example_media WHERE example_id = ?
                 ORDER BY sort_order ASC, id ASC`
            )
                .bind(id)
                .all();

            const media = ((mediaRes.results as Record<string, unknown>[]) || []).map((m) => ({
                id: m.id as number,
                kind: m.kind as string,
                url: showcaseMediaUrlFromKey(String(m.r2_key)),
                mimeType: (m.mime_type as string) || null,
            }));

            examples.push({
                id,
                title: String(ex.title),
                description: (ex.description as string) || null,
                features: parseFeaturesJson(ex.features_json as string | null),
                media,
            });
        }
    } catch (e) {
        console.warn('getShowcaseDetail DB error', e);
    }

    return { slug, title, description, features, heroImageUrl, examples };
}
