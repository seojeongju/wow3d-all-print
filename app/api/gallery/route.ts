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
        const offset = (page - 1) * limit;

        let items: any[] = [];
        let total = 0;

        try {
            // 원본 서버에서 200건 가져오기 (강력한 캐시 동기화 무효화)
            const sourceUrl = 'https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=200';
            const res = await fetch(sourceUrl, { cache: 'no-store', next: { revalidate: 0 } });
            const rawData = await res.json();
            const posts = rawData.data || [];

            // 프론트엔드 GalleryItem 규격에 맞춰 파싱 및 맵핑
            const parsedItems = posts.map((post: any) => {
                let img = (post.images && post.images.length) ? post.images[0] : (post.thumbnail_url || '');
                if (!img && post.content) {
                    const m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (m) img = m[1];
                }
                
                // 원본 서버 절대 경로로 교정
                if (img && img.startsWith('/')) {
                    img = 'https://3dcookiehd.pages.dev' + img;
                }

                // 출력 방식(FDM, SLA 등) 자동 판단
                let method = null;
                const searchStr = ((post.title || '') + ' ' + (post.content || '')).toUpperCase();
                if (searchStr.includes('FDM')) method = 'FDM';
                else if (searchStr.includes('SLA')) method = 'SLA';
                else if (searchStr.includes('DLP')) method = 'DLP';
                else if (searchStr.includes('MSLA')) method = 'DLP';

                // 순수 텍스트 설명 추출
                let desc = '';
                if (post.content) {
                    desc = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);
                }

                return {
                    id: post.id,
                    title: post.title || '무제',
                    description: desc,
                    image_url: img || '', 
                    material: null,
                    print_method: method,
                    tags: '[]',
                    created_at: post.created_at
                };
            }).filter((item: any) => item.image_url); // 이미지가 존재하는 글만 유효함

            // 메모리 페이징 처리
            total = parsedItems.length;
            items = parsedItems.slice(offset, offset + limit);

        } catch (err) {
            console.error('Remote fetch error:', err);
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

        let result: { meta: { last_row_id?: number } };
        try {
            result = await env.DB.prepare(
                `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags, created_by_user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(admin.storeId, title, description, imageUrl, material, printMethod, tagsRaw, admin.userId).run() as { meta: { last_row_id?: number } };
        } catch (colErr: unknown) {
            const msg = String(colErr instanceof Error ? colErr.message : colErr);
            if (msg.includes('created_by_user_id') || msg.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(admin.storeId, title, description, imageUrl, material, printMethod, tagsRaw).run() as { meta: { last_row_id?: number } };
            } else {
                throw colErr;
            }
        }

        const newId = (result.meta as any)?.last_row_id;
        return NextResponse.json({ success: true, data: { id: newId, imageUrl } }, { status: 201 });
    } catch (e) {
        console.error('POST /api/gallery', e);
        return NextResponse.json({ error: '갤러리 등록 실패' }, { status: 500 });
    }
}
