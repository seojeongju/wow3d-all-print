import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAuthOrGuest } from '@/lib/api-utils';
import {
    REMOVE_BG_GUEST_DAILY_LIMIT,
    REMOVE_BG_IMAGE_MAX_BYTES,
    REMOVE_BG_USER_DAILY_LIMIT,
    isAllowedRemoveBgImage,
    parseRemoveBgError,
} from '@/lib/maker-remove-bg';

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';

function getRemoveBgApiKey(): string | null {
    if (process.env.REMOVE_BG_API_KEY) return process.env.REMOVE_BG_API_KEY;
    try {
        const { env } = getCloudflareContext();
        const e = env as unknown as Record<string, string | undefined>;
        if (e?.REMOVE_BG_API_KEY) return e.REMOVE_BG_API_KEY;
    } catch {
        /* 로컬 등 */
    }
    return null;
}

async function countUsedToday(
    db: CloudflareEnv['DB'],
    userId: number | null,
    sessionId: string | null
): Promise<number | null> {
    try {
        if (userId != null) {
            const r = await db
                .prepare(
                    `SELECT COUNT(*) AS c FROM maker_remove_bg_logs
                     WHERE user_id = ? AND created_at >= datetime('now', '-1 day')`
                )
                .bind(userId)
                .first<{ c: number }>();
            return Number(r?.c) || 0;
        }
        if (sessionId) {
            const r = await db
                .prepare(
                    `SELECT COUNT(*) AS c FROM maker_remove_bg_logs
                     WHERE session_id = ? AND created_at >= datetime('now', '-1 day')`
                )
                .bind(sessionId)
                .first<{ c: number }>();
            return Number(r?.c) || 0;
        }
        return 0;
    } catch {
        return null;
    }
}

function quotaFromAuth(auth: Awaited<ReturnType<typeof requireAuthOrGuest>>): {
    userId: number | null
    sessionId: string | null
    limit: number
} | null {
    if (auth instanceof Response) return null;
    if (auth.isGuest) {
        return { userId: null, sessionId: auth.sessionId, limit: REMOVE_BG_GUEST_DAILY_LIMIT };
    }
    return { userId: auth.userId, sessionId: null, limit: REMOVE_BG_USER_DAILY_LIMIT };
}

/** 배경 제거 API 설정 여부 + (세션이 있으면) 남은 횟수 */
export async function GET(request: NextRequest) {
    const configured = !!getRemoveBgApiKey();
    const payload: {
        configured: boolean
        remaining?: number
        limit?: number
        used?: number
        guest?: boolean
    } = { configured };

    try {
        const auth = await requireAuthOrGuest(request);
        const quota = quotaFromAuth(auth);
        if (quota) {
            const { env } = getCloudflareContext();
            if (env?.DB) {
                const used = await countUsedToday(env.DB, quota.userId, quota.sessionId);
                if (used != null) {
                    payload.used = used;
                    payload.limit = quota.limit;
                    payload.remaining = Math.max(0, quota.limit - used);
                    payload.guest = quota.userId == null;
                }
            }
        }
    } catch {
        /* 한도 조회 실패해도 configured는 반환 */
    }

    return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
    const apiKey = getRemoveBgApiKey();
    if (!apiKey) {
        return NextResponse.json(
            { error: '배경 제거 API가 설정되지 않았습니다. 배경 없이 변환하거나 관리자에게 문의해 주세요.', code: 'NOT_CONFIGURED' },
            { status: 503 }
        );
    }

    try {
        const auth = await requireAuthOrGuest(request);
        const quota = quotaFromAuth(auth);

        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
        }
        if (!isAllowedRemoveBgImage(file)) {
            return NextResponse.json({ error: 'JPG 또는 PNG만 배경 제거할 수 있습니다.' }, { status: 400 });
        }
        if (file.size > REMOVE_BG_IMAGE_MAX_BYTES) {
            return NextResponse.json({ error: '이미지는 최대 8MB까지 가능합니다.' }, { status: 400 });
        }

        let env: CloudflareEnv | null = null;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = null;
        }

        if (quota && env?.DB) {
            const used = await countUsedToday(env.DB, quota.userId, quota.sessionId);
            if (used != null && used >= quota.limit) {
                return NextResponse.json(
                    {
                        error: `오늘 배경 제거 한도(${quota.limit}회)에 도달했습니다. 배경 없이 변환하거나 내일 다시 시도해 주세요.`,
                        code: 'DAILY_LIMIT',
                        limit: quota.limit,
                        remaining: 0,
                    },
                    { status: 429 }
                );
            }
        }

        const fileBytes = await file.arrayBuffer();
        const fileName = 'name' in file && typeof file.name === 'string' ? file.name : 'image.png';
        const fileType = file.type || 'image/png';

        let res: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            const body = new FormData();
            body.append('image_file', new File([fileBytes], fileName, { type: fileType }));
            body.append('size', 'auto');
            body.append('format', 'png');
            res = await fetch(REMOVE_BG_URL, {
                method: 'POST',
                headers: { 'X-Api-Key': apiKey },
                body,
            });
            if (res.ok) break;
            if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
                await new Promise((r) => setTimeout(r, 400));
                continue;
            }
            break;
        }

        if (!res || !res.ok) {
            const text = res ? await res.text() : '';
            const status = res?.status ?? 502;
            return NextResponse.json(
                { error: parseRemoveBgError(status, text), code: status === 402 ? 'CREDITS' : 'UPSTREAM' },
                { status: status >= 400 && status < 600 ? status : 502 }
            );
        }

        if (quota && env?.DB) {
            try {
                await env.DB.prepare(
                    `INSERT INTO maker_remove_bg_logs (user_id, session_id) VALUES (?, ?)`
                )
                    .bind(quota.userId, quota.sessionId)
                    .run();
            } catch (e) {
                console.warn('[remove-bg] log insert skipped', e);
            }
        }

        const blob = await res.blob();
        const remainingHeader =
            quota && env?.DB
                ? await countUsedToday(env.DB, quota.userId, quota.sessionId)
                : null;

        const headers: Record<string, string> = {
            'Content-Type': blob.type || 'image/png',
            'Content-Disposition': 'inline; filename="no-bg.png"',
        };
        if (remainingHeader != null && quota) {
            headers['X-Remove-Bg-Remaining'] = String(Math.max(0, quota.limit - remainingHeader));
            headers['X-Remove-Bg-Limit'] = String(quota.limit);
        }

        return new NextResponse(blob, { headers });
    } catch (e) {
        console.error('[remove-bg]', e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : '배경 제거 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
