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
        const storeIdParam = url.searchParams.get('store_id');
        const offset = (page - 1) * limit;

        // 1. 로컬 DB에서 아이템 조회
        let localItems: any[] = [];
        let localTotal = 0;
        try {
            // store_id가 있으면 필터링, 없으면 전체 조회 (단일 테넌트 환경 대응)
            let whereClause = 'WHERE is_visible = 1';
            let params: any[] = [];
            if (storeIdParam) {
                whereClause += ' AND store_id = ?';
                params.push(parseInt(storeIdParam));
            }

            const rows = await env.DB.prepare(
                `SELECT * FROM gallery_items 
                 ${whereClause}
                 ORDER BY sort_order DESC, created_at DESC
                 LIMIT ? OFFSET ?`
            ).bind(...params, limit, offset).all();
            
            localItems = (rows.results as any[]) || [];
            
            const countRow = await env.DB.prepare(
                `SELECT COUNT(*) as cnt FROM gallery_items ${whereClause}`
            ).bind(...params).first<{ cnt: number }>();
            localTotal = countRow?.cnt || 0;

            // 만약 특정 store_id로 검색했는데 결과가 없으면, 전체에서 한 번 더 찾아봄 (하이브리드 대응)
            if (localItems.length === 0 && storeIdParam) {
                const fallbackRows = await env.DB.prepare(
                    `SELECT * FROM gallery_items WHERE is_visible = 1 ORDER BY created_at DESC LIMIT ?`
                ).bind(limit).all();
                if (fallbackRows.results?.length) {
                    localItems = fallbackRows.results as any[];
                    localTotal = localItems.length;
                }
            }
        } catch (dbErr) {
            console.error('Local DB gallery fetch error:', dbErr);
        }

        let items = localItems;
        let total = localTotal;

        // 2. 로컬 데이터가 적을 경우 원격 데이터 보충
        if (items.length < limit) {
            try {
                const remoteLimit = limit * 2;
                const sourceUrl = `https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=${remoteLimit}`;
                const res = await fetch(sourceUrl, { cache: 'no-store' });
                const rawData = await res.json();
                const posts = rawData.data || [];

                const remoteItems = posts
                    // 절대 경로(http) 이미지가 하나도 없는 항목은 사전 제외
                    .filter((post: any) => {
                        return post.images && post.images.some((i: string) => i && i.startsWith('http'));
                    })
                    .map((post: any) => {
                    // images 배열에서 절대 경로(http)를 우선 선택
                    let img = '';
                    if (post.images && post.images.length > 0) {
                        const absImg = post.images.find((i: string) => i && i.startsWith('http'));
                        img = absImg || '';
                    }
                    if (!img) img = post.thumbnail_url || '';
                    
                    // 절대 경로가 확보된 경우에만 진행 (상대경로 도메인 교정 불필요)
                    if (!img || !img.startsWith('http')) return null;

                    // 출력 방식 자동 판단 (기존 로직 복구)
                    let method = null;
                    const searchStr = ((post.title || '') + ' ' + (post.content || '')).toUpperCase();
                    if (searchStr.includes('FDM')) method = 'FDM';
                    else if (searchStr.includes('SLA')) method = 'SLA';
                    else if (searchStr.includes('DLP')) method = 'DLP';
                    else if (searchStr.includes('MSLA')) method = 'DLP';

                    // 제목 및 설명 추출 (HTML 태그 제거 및 정제)
                    const cleanText = (text: string) => {
                        if (!text) return '';
                        let cleaned = text
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/\s+/g, ' ')
                            .trim();
                        if (cleaned.includes('&nbsp;')) cleaned = cleaned.replace(/&nbsp;/g, ' ');
                        return cleaned;
                    };

                    const title = cleanText(post.title || '무제');
                    const desc = cleanText(post.content || '').substring(0, 150);

                    return {
                        id: `remote_${post.id}`,
                        title: title,
                        description: desc,
                        image_url: img, 
                        material: null,
                        print_method: method,
                        tags: '[]',
                        created_at: post.created_at
                    };
                }).filter((item: any) => item !== null && item.image_url);

                const existingIds = new Set(items.map(it => String(it.id)));
                for (const rItem of remoteItems) {
                    if (items.length >= limit) break;
                    if (!existingIds.has(String(rItem.id))) items.push(rItem);
                }
                total = Math.max(total, items.length);
            } catch (err) {
                console.error('Remote fetch error:', err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                items,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
                debug: { localCount: localTotal, storeIdUsed: storeIdParam }
            },
        });
    } catch (e) {
        console.error('GET /api/gallery', e);
        return NextResponse.json({ error: '갤러리 조회 실패' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────
// POST /api/gallery  (Admin 전용)
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

        let result: any;
        const storeIdToUse = admin.storeId ?? 1;

        try {
            result = await env.DB.prepare(
                `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags, created_by_user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw, admin.userId).run();
        } catch (colErr: any) {
            if (colErr.message?.includes('created_by_user_id') || colErr.message?.includes('no such column')) {
                result = await env.DB.prepare(
                    `INSERT INTO gallery_items (store_id, title, description, image_url, material, print_method, tags)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(storeIdToUse, title, description, imageUrl, material, printMethod, tagsRaw).run();
            } else {
                throw colErr;
            }
        }

        const newId = result.meta?.last_row_id;
        return NextResponse.json({ 
            success: true, 
            data: { id: newId, imageUrl, storeId: storeIdToUse } 
        }, { status: 201 });
    } catch (e) {
        console.error('POST /api/gallery', e);
        return NextResponse.json({ error: '갤러리 등록 실패' }, { status: 500 });
    }
}
