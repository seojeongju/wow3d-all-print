import { NextResponse } from 'next/server';

export const runtime = 'edge';

/** GET /api/health - Edge/배포 정상 여부 확인 (import 최소화) */
export async function GET() {
    return NextResponse.json({ ok: true, t: Date.now() });
}
