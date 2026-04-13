import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
    SHOWCASE_DEFAULTS,
    SHOWCASE_SLUGS,
    defaultsForSlug,
    parseFeaturesJson,
    showcaseMediaUrlFromKey,
} from '@/lib/showcase';

const DEFAULT_STORE_ID = 1;

/** 공개: /expert 카드용 카테고리 목록 (DB 오버라이드 + 정적 폴백) */
export async function GET() {
    try {
        const { env } = getCloudflareContext();
        const storeId = DEFAULT_STORE_ID;

        const rows: Record<string, Record<string, unknown>> = {};
        if (env?.DB) {
            try {
                const res = await env.DB.prepare(
                    `SELECT category_slug, title, description, features_json, card_image_key
                     FROM showcase_category_content WHERE store_id = ?`
                )
                    .bind(storeId)
                    .all();
                for (const r of (res.results as Record<string, unknown>[]) || []) {
                    const slug = r.category_slug as string;
                    rows[slug] = r;
                }
            } catch (e) {
                console.warn('showcase_category_content missing or error', e);
            }
        }

        const items = SHOWCASE_SLUGS.map((slug) => {
            const def = defaultsForSlug(slug)!;
            const row = rows[slug];
            const title = (row?.title as string)?.trim() || def.defaultTitle;
            const description = (row?.description as string)?.trim() || def.defaultDescription;
            const features = row?.features_json
                ? parseFeaturesJson(row.features_json as string)
                : def.defaultFeatures;
            const cardKey = (row?.card_image_key as string)?.trim() || '';
            const cardImageUrl = cardKey ? showcaseMediaUrlFromKey(cardKey) : def.fallbackImage;

            return {
                slug,
                title,
                description,
                features,
                cardImageUrl,
            };
        });

        return NextResponse.json({ success: true, data: { items } });
    } catch (e) {
        console.error('GET /api/showcase/categories', e);
        return NextResponse.json({ error: '쇼케이스 목록 조회 실패' }, { status: 500 });
    }
}
