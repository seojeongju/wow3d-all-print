import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

const STATUS_VALUES = ['new', 'read', 'replied', 'closed'];
const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';

function isMissingStoreIdColumn(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /no such column:\s*store_id/i.test(msg);
}

async function listInquiries(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareContext>>['env']>['DB'],
  storeId: number,
  status: string | null
) {
  const hasStatus = status && STATUS_VALUES.includes(status);

  try {
    const stmt = hasStatus
      ? db.prepare(
            `SELECT * FROM inquiries WHERE ${STORE_INQUIRIES} AND status = ? ORDER BY created_at DESC LIMIT 200`
        ).bind(storeId, status)
      : db.prepare(
            `SELECT * FROM inquiries WHERE ${STORE_INQUIRIES} ORDER BY created_at DESC LIMIT 200`
        ).bind(storeId);
    const { results } = await stmt.all();
    return results || [];
  } catch (e) {
    if (!isMissingStoreIdColumn(e)) throw e;
    const stmt = hasStatus
      ? db.prepare(`SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT 200`).bind(status)
      : db.prepare(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200`);
    const { results } = await stmt.all();
    return results || [];
  }
}

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

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const status = req.nextUrl.searchParams.get('status');
    const results = await listInquiries(env.DB, storeId, status);

    return Response.json({ success: true, data: results });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('GET /api/admin/inquiries', e);
    return Response.json({ error: 'Failed to fetch inquiries', detail }, { status: 500 });
  }
}
