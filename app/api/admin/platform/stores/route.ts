import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env.DB) return errorResponse('Database not available', 503);

        const { results } = await env.DB.prepare('SELECT * FROM stores ORDER BY created_at DESC').all();

        return successResponse(results);
    } catch (e) {
        console.error(e);
        return errorResponse('Failed to fetch stores', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env.DB) return errorResponse('Database not available', 503);

        const body = await req.json() as { name: string; slug: string; owner_email: string };
        if (!body.name || !body.slug) {
            return errorResponse('Missing name or slug', 400);
        }

        // 1. 중복 슬러그 체크
        const existing = await env.DB.prepare('SELECT id FROM stores WHERE slug = ?').bind(body.slug).first();
        if (existing) {
            return errorResponse('Slug already exists', 409);
        }

        // 2. 소유자(User) 조회 (옵션)
        let ownerId: number | null = null;
        if (body.owner_email) {
            const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.owner_email).first();
            if (user) {
                ownerId = Number(user.id);
            } else {
                // 유저가 없으면 일단 경고? 아니면 그냥 생성
                // 여기선 그냥 owner_id 없이 생성하거나 에러 처리. 일단 진행.
            }
        }

        // 3. 스토어 생성
        const result = await env.DB.prepare(
            `INSERT INTO stores (name, slug, owner_id, settings) VALUES (?, ?, ?, ?)`
        ).bind(
            body.name,
            body.slug,
            ownerId,
            JSON.stringify({ theme_color: '#000000' }) // 기본값
        ).run();

        if (!result.success) {
            return errorResponse('Failed to insert store', 500);
        }

        // 생성된 ID 가져오기 (lastRowId가 비표준일 수 있으므로 다시 조회하거나 result.meta.last_row_id 사용)
        const newStore = await env.DB.prepare('SELECT * FROM stores WHERE slug = ?').bind(body.slug).first();

        // 4. 소유자의 store_id 업데이트 및 role=admin 부여
        if (ownerId && newStore) {
            await env.DB.prepare(
                `UPDATE users SET store_id = ?, role = 'admin' WHERE id = ?`
            ).bind(newStore.id, ownerId).run();
        }

        return successResponse(newStore);

    } catch (e) {
        console.error(e);
        return errorResponse('Failed to create store', 500);
    }
}
