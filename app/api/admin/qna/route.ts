import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireAdminAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return Response.json({ error: 'DB not available' }, { status: 503 });

    const auth = await requireAdminAuth(req, env.DB);
    if (auth instanceof Response) return auth;
    const { storeId } = auth;

    const { results } = await env.DB.prepare(
      `SELECT * FROM qna WHERE store_id = ? ORDER BY display_order ASC, created_at DESC`
    ).bind(storeId).all();

    return Response.json({ success: true, data: results || [] });
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
    ).bind(
      question,
      answer,
      category || 'general',
      is_published === false ? 0 : 1,
      display_order || 0,
      storeId
    ).run();

    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (e) {
    console.error('POST /api/admin/qna', e);
    return Response.json({ error: 'Failed to create Q&A' }, { status: 500 });
  }
}
