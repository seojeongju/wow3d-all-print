import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

function likePattern(raw: string): string {
  const t = raw.trim().replace(/[%_\\]/g, '');
  if (!t) return '';
  return `%${t}%`;
}

/**
 * GET /api/admin/qna - FAQ 목록 (관리자)
 * Query: page, limit, q, published=all|1|0|unpublished
 */
export async function GET(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return Response.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
    const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const offset = (page - 1) * limit;
    const pattern = likePattern(req.nextUrl.searchParams.get('q') || '');
    const publishedParam = (req.nextUrl.searchParams.get('published') || 'all').trim().toLowerCase();

    let where = 'WHERE store_id = ?';
    const binds: (string | number)[] = [storeId];

    if (publishedParam === '0' || publishedParam === 'unpublished') {
      where += ' AND (is_published = 0 OR is_published IS NULL)';
    } else if (publishedParam === '1' || publishedParam === 'published') {
      where += ' AND is_published = 1';
    }

    if (pattern) {
      where += ` AND (
        LOWER(COALESCE(question, '')) LIKE LOWER(?)
        OR LOWER(COALESCE(answer, '')) LIKE LOWER(?)
      )`;
      binds.push(pattern, pattern);
    }

    const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM qna ${where}`)
      .bind(...binds)
      .first<{ cnt?: number }>();
    const total = Number(countRow?.cnt ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const unpublishedRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM qna WHERE store_id = ? AND (is_published = 0 OR is_published IS NULL)`
    )
      .bind(storeId)
      .first<{ cnt?: number }>();
    const unpublishedCount = Number(unpublishedRow?.cnt ?? 0);

    const publishedRow = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM qna WHERE store_id = ? AND is_published = 1`
    )
      .bind(storeId)
      .first<{ cnt?: number }>();
    const publishedCount = Number(publishedRow?.cnt ?? 0);

    const maxOrderRow = await env.DB.prepare(
      `SELECT COALESCE(MAX(display_order), -1) as max_order FROM qna WHERE store_id = ?`
    )
      .bind(storeId)
      .first<{ max_order?: number }>();
    const maxDisplayOrder = Number(maxOrderRow?.max_order ?? -1);

    // 미게시 먼저, 이후 노출 순서
    const { results } = await env.DB.prepare(
      `SELECT * FROM qna ${where}
       ORDER BY CASE WHEN is_published = 1 THEN 1 ELSE 0 END ASC,
                display_order ASC,
                created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...binds, limit, offset)
      .all();

    return Response.json({
      success: true,
      data: {
        items: results || [],
        pagination: { page, limit, total, totalPages },
        unpublishedCount,
        publishedCount,
        maxDisplayOrder,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/qna', e);
    return Response.json({ error: 'Failed to fetch Q&A' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return Response.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const body = await req.json();
    const { question, answer, category, is_published, display_order } = body;

    if (!question || !answer) {
      return Response.json({ error: 'Question and Answer are required' }, { status: 400 });
    }

    const result = await env.DB.prepare(
      `INSERT INTO qna (question, answer, category, is_published, display_order, store_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        question,
        answer,
        category || 'general',
        is_published === false ? 0 : 1,
        display_order || 0,
        storeId
      )
      .run();

    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (e) {
    console.error('POST /api/admin/qna', e);
    return Response.json({ error: 'Failed to create Q&A' }, { status: 500 });
  }
}
