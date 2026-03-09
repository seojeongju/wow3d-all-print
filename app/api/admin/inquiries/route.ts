import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

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

    // 인증 및 store_id 획득
    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const status = req.nextUrl.searchParams.get('status');
    const hasStatus = status && STATUS_VALUES.includes(status);

    const stmt = hasStatus
      ? env.DB.prepare(`SELECT * FROM inquiries WHERE store_id = ? AND status = ? ORDER BY created_at DESC LIMIT 200`).bind(storeId, status)
      : env.DB.prepare(`SELECT * FROM inquiries WHERE store_id = ? ORDER BY created_at DESC LIMIT 200`).bind(storeId);
    const { results } = await stmt.all();

    return Response.json({ success: true, data: results || [] });
  } catch (e) {
    console.error('GET /api/admin/inquiries', e);
    return Response.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
