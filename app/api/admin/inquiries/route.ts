import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

const STATUS_VALUES = ['new', 'read', 'replied', 'closed'];
const STORE_INQUIRIES = '(store_id = ? OR store_id IS NULL)';

function isMissingStoreIdColumn(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /no such column:\s*store_id/i.test(msg);
}

function likePattern(raw: string): string {
  const t = raw.trim().replace(/[%_\\]/g, '');
  if (!t) return '';
  return `%${t}%`;
}

function parsePageLimit(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
  const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20;
  const limit = Math.min(100, Math.max(1, limitRaw));
  return { page, limit, offset: (page - 1) * limit };
}

type ListResult = {
  items: unknown[];
  total: number;
};

async function listInquiriesPaginated(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareContext>>['env']>['DB'],
  storeId: number,
  status: string | null,
  pattern: string,
  limit: number,
  offset: number,
  useStoreFilter: boolean
): Promise<ListResult> {
  const hasStatus = !!(status && STATUS_VALUES.includes(status));
  const whereParts: string[] = [];
  const binds: (string | number)[] = [];

  if (useStoreFilter) {
    whereParts.push(STORE_INQUIRIES);
    binds.push(storeId);
  }
  if (hasStatus) {
    whereParts.push('status = ?');
    binds.push(status!);
  }
  if (pattern) {
    whereParts.push(`(
      LOWER(COALESCE(name, '')) LIKE LOWER(?)
      OR LOWER(COALESCE(email, '')) LIKE LOWER(?)
      OR LOWER(COALESCE(subject, '')) LIKE LOWER(?)
      OR LOWER(COALESCE(message, '')) LIKE LOWER(?)
    )`);
    binds.push(pattern, pattern, pattern, pattern);
  }

  const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const countRow = await db
    .prepare(`SELECT COUNT(*) as cnt FROM inquiries ${where}`)
    .bind(...binds)
    .first<{ cnt?: number }>();
  const total = Number(countRow?.cnt ?? 0);

  const { results } = await db
    .prepare(
      `SELECT * FROM inquiries ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...binds, limit, offset)
    .all();

  return { items: results || [], total };
}

/**
 * GET /api/admin/inquiries - 문의 목록 (관리자)
 * Query: page, limit, status, q
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
    const pattern = likePattern(req.nextUrl.searchParams.get('q') || '');
    const { page, limit, offset } = parsePageLimit(req);

    try {
      const { items, total } = await listInquiriesPaginated(
        env.DB,
        storeId,
        status,
        pattern,
        limit,
        offset,
        true
      );
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return Response.json({
        success: true,
        data: {
          items,
          pagination: { page, limit, total, totalPages },
        },
      });
    } catch (e) {
      if (!isMissingStoreIdColumn(e)) throw e;
      const { items, total } = await listInquiriesPaginated(
        env.DB,
        storeId,
        status,
        pattern,
        limit,
        offset,
        false
      );
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return Response.json({
        success: true,
        data: {
          items,
          pagination: { page, limit, total, totalPages },
        },
      });
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('GET /api/admin/inquiries', e);
    return Response.json({ error: 'Failed to fetch inquiries', detail }, { status: 500 });
  }
}
