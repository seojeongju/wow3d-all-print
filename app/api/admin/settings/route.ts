import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { env } = getRequestContext() as any;
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM print_settings"
        ).all();

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { env } = getRequestContext() as any;
    try {
        const body = await req.json() as any[];
        // Expecting array of { key, value }

        // Use batch execution
        const stmts = body.map(setting =>
            env.DB.prepare(
                "INSERT INTO print_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
            ).bind(setting.key, String(setting.value))
        );

        await env.DB.batch(stmts);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
