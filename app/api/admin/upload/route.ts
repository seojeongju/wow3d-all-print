import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

/**
 * POST /api/admin/upload
 * 보디: FormData { file: File, type: string (logo | seal | etc) }
 */
export async function POST(req: NextRequest) {
    try {
        const { env } = getCloudflareContext();
        if (!env?.BUCKET) return NextResponse.json({ error: 'R2 Bucket not available' }, { status: 503 });
        if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

        // 관리자 권한 확인
        const auth = await requireAdminAuth(req, env.DB);
        if (auth instanceof Response) return auth;

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const uploadType = (formData.get('type') as string) || 'general';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 파일명 생성 및 업로드 경로 설정
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).slice(2, 8);
        const extension = file.name.split('.').pop() || 'png';
        const fileName = `${uploadType}_${timestamp}_${randomString}.${extension}`;
        const key = `assets/company/${fileName}`;

        const buffer = await file.arrayBuffer();
        
        // R2 업로드
        await env.BUCKET.put(key, buffer, {
            httpMetadata: {
                contentType: file.type || 'image/png',
                cacheControl: 'public, max-age=31536000',
            }
        });

        // 결과 반환 (이미지 조회를 위한 커스텀 도메인이 있다면 해당 주소를 사용하고, 없으면 Key 반환)
        // 현재 갤러리 이미지 조회 로직을 참고하여 경로 생성
        const url = `/api/assets/${fileName}?key=${key}`; 
        
        return NextResponse.json({ 
            success: true, 
            data: { 
                url: url,
                key: key,
                fileName: fileName 
            } 
        });

    } catch (e) {
        console.error('POST /api/admin/upload', e);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
