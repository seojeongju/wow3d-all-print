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

        // 2. 원격 데이터를 항상 가져와서 합산 (최신순 정렬을 위해)
        let remoteItems: any[] = [];
        try {
            // 원격에서 충분한 양을 가져옴 (페이지 전체를 커버하도록)
            const remoteLimit = Math.max(limit * 5, 50);
            const sourceUrl = `https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=${remoteLimit}`;
            const res = await fetch(sourceUrl, { cache: 'no-store' });
            const rawData = await res.json();
            const posts = rawData.data || [];

            remoteItems = posts
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
                    if (!img || !img.startsWith('http')) return null;

                    // 출력 방식 자동 판단
                    let method = null;
                    const searchStr = ((post.title || '') + ' ' + (post.content || '')).toUpperCase();
                    if (searchStr.includes('FDM')) method = 'FDM';
                    else if (searchStr.includes('SLA')) method = 'SLA';
                    else if (searchStr.includes('DLP')) method = 'DLP';
                    else if (searchStr.includes('MSLA')) method = 'DLP';

                    // HTML 태그/엔티티 제거
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

                    return {
                        id: `remote_${post.id}`,
                        title: cleanText(post.title || '무제'),
                        description: cleanText(post.content || '').substring(0, 150),
                        image_url: img,
                        material: null,
                        print_method: method,
                        tags: '[]',
                        created_at: post.created_at
                    };
                })
                .filter((item: any) => item !== null && item.image_url);
        } catch (err) {
            console.error('Remote fetch error:', err);
        }

        // 3. 로컬 + 원격 합산 후 중복 제거 (로컬 우선)
        const localIds = new Set(localItems.map(it => String(it.id)));
        const merged = [
            ...localItems,
            ...remoteItems.filter((r: any) => !localIds.has(String(r.id)))
        ];

        // 4. created_at 기준 최신순 정렬
        merged.sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
        });

        // 5. 전체 개수 기준 페이지네이션 적용
        const total = merged.length;
        const items = merged.slice(offset, offset + limit);

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
