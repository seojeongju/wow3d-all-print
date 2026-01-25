import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULTS = [
    { key: 'operating_rate', value: '82', description: '가동률 (%)' },
    { key: 'operating_detail', value: '프린터 12/15대 가동중', description: '가동 상세' },
    { key: 'min_order_amount', value: '5000', description: '최소 주문 금액 (원)' },
    { key: 'labor_cost_per_hour', value: '8000', description: '인건비 시간당 (원)' },
];

export async function GET(_req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    try {
        const { results } = await env.DB.prepare('SELECT key, value, description FROM print_settings').all();
        const rows = (results || []) as { key: string; value: string; description?: string }[];
        const data = rows.length > 0 ? rows : DEFAULTS;
        return NextResponse.json({ success: true, data });
    } catch {
        return NextResponse.json({ success: true, data: DEFAULTS });
    }
}

export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });
    try {
        const body = (await req.json()) as { key: string; value: string; description?: string }[];
        if (!Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: 'Array of { key, value, description? } required' }, { status: 400 });
        }
        for (const s of body) {
            const key = String(s?.key ?? '').trim();
            const value = String(s?.value ?? '');
            const desc = s?.description != null ? String(s.description) : null;
            if (!key) continue;
            await env.DB.prepare(
                `INSERT INTO print_settings (key, value, description) VALUES (?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = COALESCE(excluded.description, print_settings.description), updated_at = CURRENT_TIMESTAMP`
            ).bind(key, value, desc).run();
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('POST /api/admin/settings', e);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
