import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

/**
 * GET /api/admin/company - 회사 정보 조회
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const info = await env.DB.prepare(
            'SELECT * FROM company_info WHERE store_id = ?'
        ).bind(storeId).first();

        return NextResponse.json({ success: true, data: info || null });
    } catch (e) {
        console.error('GET /api/admin/company', e);
        return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 });
    }
}

/**
 * POST /api/admin/company - 회사 정보 저장/수정 (Upsert)
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext();
    if (!env?.DB) return NextResponse.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    try {
        const body = await req.json() as Record<string, any>;

        const fields = [
            'business_number', 'company_name', 'representative',
            'business_type', 'business_item', 'address', 'phone',
            'fax', 'email', 'website', 'logo_url',
            'estimate_header_note', 'estimate_footer_note', 'estimate_valid_days',
            'bank_name', 'bank_account', 'bank_holder',
        ];

        // 존재 여부 확인
        const existing = await env.DB.prepare(
            'SELECT id FROM company_info WHERE store_id = ?'
        ).bind(storeId).first();

        if (existing) {
            // UPDATE
            const setClauses = fields.map(f => `${f} = ?`).join(', ');
            const values = fields.map(f => body[f] ?? null);
            await env.DB.prepare(
                `UPDATE company_info SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE store_id = ?`
            ).bind(...values, storeId).run();
        } else {
            // INSERT
            const cols = ['store_id', ...fields].join(', ');
            const placeholders = ['?', ...fields.map(() => '?')].join(', ');
            const values = [storeId, ...fields.map(f => body[f] ?? null)];
            await env.DB.prepare(
                `INSERT INTO company_info (${cols}) VALUES (${placeholders})`
            ).bind(...values).run();
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('POST /api/admin/company', e);
        return NextResponse.json({ error: 'Failed to save company info' }, { status: 500 });
    }
}
