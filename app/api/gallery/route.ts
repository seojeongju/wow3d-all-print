import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

// ─────────────────────────────────────────────
// GET /api/gallery?page=1&limit=8&store_id=1
// 공개 갤러리 목록 조회 (메인페이지용)
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) {
            return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 });
        }

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(20, Math.max(4, parseInt(url.searchParams.get('limit') || '8')));
        const storeId = parseInt(url.searchParams.get('store_id') || '1');
        const offset = (page - 1) * limit;

        // 테이블이 없을 경우를 대비하여 안전 처리
        let items: any[] = [];
        let total = 0;
        try {
            const [rows, countRow] = await Promise.all([
                env.DB.prepare(
                    `SELECT id, title, description, image_url, material, print_method, tags, created_at
                     FROM gallery_items
                     WHERE store_id = ? AND is_visible = 1
                     ORDER BY sort_order DESC, created_at DESC
                     LIMIT ? OFFSET ?`
                ).bind(storeId, limit, offset).all(),
                env.DB.prepare(
                    `SELECT COUNT(*) as cnt FROM gallery_items WHERE store_id = ? AND is_visible = 1`
                ).bind(storeId).first<{ cnt: number }>(),
            ]);
            items = (rows.results as any[]) ?? [];
            total = countRow?.cnt ?? 0;
        } catch {
            // 테이블 미생성 상태 → 빈 배열 반환
        }

        return NextResponse.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                },
            },
        });
    } catch (e) {
        console.error('GET /api/gallery', e);
        return NextResponse.json({ error: '갤러리 조회 실패' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────
// POST /api/gallery  (Admin 전용)
// Body: FormData  { image: File, title, description, material, print_method, tags }
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.DB) return NextResponse.json({ error: 'DB 없음' }, { status: 503 });

        const admin = await requireAdminAuth(request, env.DB);
        if (admin instanceof Response) return admin;

        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const title = (formData.get('title') as string | null)?.trim() || '';
        const description = (formData.get('description') as string | null)?.trim() || '';
        const material = (formData.get('material') as string | null)?.trim() || '';
        const printMethod = (formData.get('print_method') as string | null)?.trim() || '';
        const tagsRaw = (formData.get('tags') as string | null)?.trim() || '[]';

        if (!title) return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 });
        if (!imageFile) return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 });

        // R2에 이미지 업로드
        let imageUrl = '';
        if (env.BUCKET) {
            const ext = imageFile.name.split('.').pop() || 'jpg';
            const r2Key = `gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const buf = await imageFile.arrayBuffer();
            await env.BUCKET.put(r2Key, buf, {
                httpMetadata: { contentType: imageFile.type || 'image/jpeg' },
            });
            imageUrl = r2Key;
        } else {
            return NextResponse.json({ error: 'R2 BUCKET이 없습니다' }, { status: 503 });
        }

        const result = await env.DB.prepare(
            `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags, created_by_user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(admin.storeId, title, description, imageUrl, material, printMethod, tagsRaw, admin.userId).run();

        const newId = (result.meta as any)?.last_row_id;
        return NextResponse.json({ success: true, data: { id: newId, imageUrl } }, { status: 201 });
    } catch (e) {
        console.error('POST /api/gallery', e);
        return NextResponse.json({ error: '갤러리 등록 실패' }, { status: 500 });
    }
}
