import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const STATUS_VALUES = ['new', 'read', 'replied', 'closed'];

/**
 * GET /api/admin/inquiries - 문의 목록 (관리자)
 * Query: ?status=new|read|replied|closed
 */
export async function GET(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return Response.json({ error: 'DB not available' }, { status: 503 });
    }

    const status = req.nextUrl.searchParams.get('status');
    const hasStatus = status && STATUS_VALUES.includes(status);

    const stmt = hasStatus
      ? env.DB.prepare(`SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT 200`).bind(status)
      : env.DB.prepare(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200`);
    const { results } = await stmt.all();

    return Response.json({ success: true, data: results || [] });
  } catch (e) {
    console.error('GET /api/admin/inquiries', e);
    return Response.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
