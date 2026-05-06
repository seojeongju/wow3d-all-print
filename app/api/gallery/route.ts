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
        const limit = Math.min(50, Math.max(4, parseInt(url.searchParams.get('limit') || '8')));
        const storeId = parseInt(url.searchParams.get('store_id') || '1');
        const offset = (page - 1) * limit;

        // 1. 로컬 DB에서 아이템 조회
        let localItems: any[] = [];
        let localTotal = 0;
        try {
            const rows = await env.DB.prepare(
                `SELECT * FROM gallery_items 
                 WHERE store_id = ? AND is_visible = 1
                 ORDER BY sort_order DESC, created_at DESC
                 LIMIT ? OFFSET ?`
            ).bind(storeId, limit, offset).all();
            
            localItems = (rows.results as any[]) || [];
            
            const countRow = await env.DB.prepare(
                `SELECT COUNT(*) as cnt FROM gallery_items WHERE store_id = ? AND is_visible = 1`
            ).bind(storeId).first<{ cnt: number }>();
            localTotal = countRow?.cnt || 0;
        } catch (dbErr) {
            console.error('Local DB gallery fetch error:', dbErr);
        }

        let items = localItems;
        let total = localTotal;

        // 2. 로컬 데이터가 적거나 없는 경우 원본 서버에서 가져와서 보충 (Legacy 데이터)
        if (items.length < limit) {
            try {
                const remoteLimit = limit * 2;
                const sourceUrl = `https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=${remoteLimit}`;
                const res = await fetch(sourceUrl, { cache: 'no-store', next: { revalidate: 0 } });
                const rawData = await res.json();
                const posts = rawData.data || [];

                const remoteItems = posts.map((post: any) => {
                    let img = (post.images && post.images.length) ? post.images[0] : (post.thumbnail_url || '');
                    if (!img && post.content) {
                        const m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (m) img = m[1];
                    }
                    
                    if (img && img.startsWith('/')) {
                        img = 'https://3dcookiehd.pages.dev' + img;
                    }

                    let method = null;
                    const searchStr = ((post.title || '') + ' ' + (post.content || '')).toUpperCase();
                    if (searchStr.includes('FDM')) method = 'FDM';
                    else if (searchStr.includes('SLA')) method = 'SLA';
                    else if (searchStr.includes('DLP')) method = 'DLP';

                    let desc = '';
                    if (post.content) {
                        desc = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);
                    }

                    return {
                        id: `remote_${post.id}`,
                        title: post.title || '무제',
                        description: desc,
                        image_url: img || '', 
                        material: null,
                        print_method: method,
                        tags: '[]',
                        created_at: post.created_at
                    };
                }).filter((item: any) => item.image_url);

                // 중복 방지 및 병합 (간단하게 로컬 뒤에 원격 추가)
                const existingIds = new Set(items.map(it => String(it.id)));
                for (const rItem of remoteItems) {
                    if (items.length >= limit) break;
                    if (!existingIds.has(String(rItem.id))) {
                        items.push(rItem);
                    }
                }
                
                // 전체 개수는 정확히 알기 어려우므로 로컬 개수에 원격 개수를 대략 합산
                total = localTotal + remoteItems.length;
            } catch (err) {
                console.error('Remote fetch error:', err);
            }
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
