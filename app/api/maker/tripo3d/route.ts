import { NextRequest, NextResponse } from 'next/server';

const TRIPO_BASE = 'https://api.tripo3d.ai/v2/openapi';

function getApiKey(): string | null {
    return process.env.TRIPO3D_API_KEY ?? process.env.TRIPO_API_KEY ?? null;
}

/** POST: submit task (image_to_model or text_to_model). Returns { task_id }. */
export async function POST(request: NextRequest) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Tripo3D API가 설정되지 않았습니다. TRIPO3D_API_KEY를 설정해 주세요.' },
            { status: 503 }
        );
    }

    try {
        const contentType = request.headers.get('content-type') ?? '';
        let body: { type: string; image_url?: string; prompt?: string; negative_prompt?: string; model_version?: string };

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const type = (formData.get('type') as string) || 'image_to_model';
            if (type === 'text_to_model') {
                const prompt = (formData.get('prompt') as string)?.trim();
                if (!prompt) {
                    return NextResponse.json({ error: '텍스트 생성 시 prompt가 필요합니다.' }, { status: 400 });
                }
                body = { type: 'text_to_model', prompt, model_version: 'v2.5' };
            } else {
                const file = formData.get('image') as File | null;
                if (!file || !(file instanceof Blob)) {
                    return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
                }
                const buf = Buffer.from(await file.arrayBuffer());
                const base64 = buf.toString('base64');
                const mime = file.type || 'image/jpeg';
                body = { type: 'image_to_model', image_url: `data:${mime};base64,${base64}`, model_version: 'v2.5' };
            }
        } else {
            const json = await request.json();
            const type = json.type === 'text_to_model' ? 'text_to_model' : 'image_to_model';
            if (type === 'text_to_model') {
                const prompt = (json.prompt as string)?.trim();
                if (!prompt) {
                    return NextResponse.json({ error: 'prompt가 필요합니다.' }, { status: 400 });
                }
                body = { type: 'text_to_model', prompt, negative_prompt: json.negative_prompt, model_version: json.model_version || 'v2.5' };
            } else {
                const imageUrl = json.image_url as string;
                if (!imageUrl) {
                    return NextResponse.json({ error: 'image_url이 필요합니다.' }, { status: 400 });
                }
                body = { type: 'image_to_model', image_url: imageUrl, model_version: json.model_version || 'v2.5' };
            }
        }

        const res = await fetch(`${TRIPO_BASE}/task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data?.message ?? data?.error ?? data?.msg ?? (typeof data === 'string' ? data : 'Tripo3D 요청 실패');
            return NextResponse.json(
                { error: msg },
                { status: res.status >= 400 ? res.status : 502 }
            );
        }

        const taskId = data?.data?.task_id ?? data?.task_id;
        if (!taskId) {
            return NextResponse.json({ error: 'task_id를 받지 못했습니다.' }, { status: 502 });
        }
        return NextResponse.json({ task_id: taskId });
    } catch (e) {
        console.error('[tripo3d] POST', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Tripo3D 작업 제출 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

/** GET: poll task status. ?task_id=xxx → { status, glb_url?, error? }. */
export async function GET(request: NextRequest) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Tripo3D API가 설정되지 않았습니다.' },
            { status: 503 }
        );
    }

    const taskId = request.nextUrl.searchParams.get('task_id');
    if (!taskId) {
        return NextResponse.json({ error: 'task_id가 필요합니다.' }, { status: 400 });
    }

    try {
        const res = await fetch(`${TRIPO_BASE}/task/${encodeURIComponent(taskId)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(
                { error: data?.message ?? data?.error ?? '상태 조회 실패', status: 'failed' },
                { status: res.status >= 400 ? res.status : 502 }
            );
        }

        const d = data?.data ?? data;
        const status = (d?.status ?? '').toLowerCase();
        const output = d?.output ?? d?.result ?? {};
        const modelUrl = output?.model?.url ?? output?.model ?? output?.glb_url ?? output?.pbr_model?.url ?? output?.pbr_model;

        if (status === 'success' || status === 'completed') {
            return NextResponse.json({
                status: 'success',
                glb_url: modelUrl || null,
                task_id: taskId,
            });
        }
        if (status === 'failed' || status === 'failure' || status === 'error' || status === 'cancelled' || status === 'expired') {
            return NextResponse.json({
                status: 'failed',
                error: d?.message ?? output?.error ?? '생성 실패',
                task_id: taskId,
            });
        }

        return NextResponse.json({
            status: 'processing',
            task_id: taskId,
        });
    } catch (e) {
        console.error('[tripo3d] GET', e);
        return NextResponse.json(
            { status: 'failed', error: e instanceof Error ? e.message : '상태 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
