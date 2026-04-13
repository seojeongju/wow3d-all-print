import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
    defaultsForSlug,
    isShowcaseSlug,
    parseFeaturesJson,
    showcaseMediaUrlFromKey,
} from '@/lib/showcase';

const DEFAULT_STORE_ID = 1;

/** 공개: 카테고리 상세 + 공개 예시·미디어 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        if (!isShowcaseSlug(slug)) {
            return NextResponse.json({ error: '알 수 없는 카테고리' }, { status: 404 });
        }

        const def = defaultsForSlug(slug)!;
        const { env } = getCloudflareContext();
        const storeId = DEFAULT_STORE_ID;

        let title = def.defaultTitle;
        let description = def.defaultDescription;
        let features = def.defaultFeatures;
        let heroImageUrl = def.fallbackImage;

        if (env?.DB) {
            try {
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
                    const fj = row.features_json;
                    if (fj && parseFeaturesJson(fj).length) features = parseFeaturesJson(fj);
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

                const examples: {
                    id: number;
                    title: string;
                    description: string | null;
                    features: string[];
                    media: { id: number; kind: string; url: string; mimeType: string | null }[];
                }[] = [];

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

                return NextResponse.json({
                    success: true,
                    data: {
                        slug,
                        title,
                        description,
                        features,
                        heroImageUrl,
                        examples,
                    },
                });
            } catch (e) {
                console.warn('showcase detail DB error', e);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                slug,
                title,
                description,
                features,
                heroImageUrl,
                examples: [] as unknown[],
            },
        });
    } catch (e) {
        console.error('GET /api/showcase/[slug]', e);
        return NextResponse.json({ error: '쇼케이스 조회 실패' }, { status: 500 });
    }
}
