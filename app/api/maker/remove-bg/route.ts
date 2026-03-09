import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';

function getRemoveBgApiKey(): string | null {
    // process.env 우선 (Workers에서 nodejs_compat_populate_process_env 사용 시 대시보드 변수 포함)
    if (process.env.REMOVE_BG_API_KEY) return process.env.REMOVE_BG_API_KEY;
    try {
        const { env } = getCloudflareContext();
        const e = env as unknown as Record<string, string | undefined>;
        if (e?.REMOVE_BG_API_KEY) return e.REMOVE_BG_API_KEY;
    } catch {
        // 로컬 등 Cloudflare 컨텍스트 없을 때
    }
    return null;
}

/** 배경 제거 API 설정 여부 확인 (UI에서 토글 안내용) */
export async function GET() {
    const configured = !!getRemoveBgApiKey();
    return NextResponse.json({ configured });
}

export async function POST(request: NextRequest) {
    const apiKey = getRemoveBgApiKey();
    if (!apiKey) {
        return NextResponse.json(
            { error: '배경 제거 API가 설정되지 않았습니다. REMOVE_BG_API_KEY를 설정해 주세요.' },
            { status: 503 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
        }

        const body = new FormData();
        body.append('image_file', file);
        body.append('size', 'auto');

        const res = await fetch(REMOVE_BG_URL, {
            method: 'POST',
            headers: { 'X-Api-Key': apiKey },
            body
        });

        if (!res.ok) {
            const text = await res.text();
            const errMsg = res.status === 402 ? 'remove.bg API 한도 초과' : (text || '배경 제거 실패');
            return NextResponse.json({ error: errMsg }, { status: res.status >= 400 ? res.status : 502 });
        }

        const blob = await res.blob();
        return new NextResponse(blob, {
            headers: {
                'Content-Type': blob.type || 'image/png',
                'Content-Disposition': 'inline; filename="no-bg.png"'
            }
        });
    } catch (e) {
        console.error('[remove-bg]', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : '배경 제거 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
