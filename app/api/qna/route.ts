import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return Response.json({ error: 'DB not available' }, { status: 503 });
    }

    // 모든 공개된 Q&A 항목 조회 (정렬 순서: display_order ASC, created_at DESC)
    const { results } = await env.DB.prepare(
      `SELECT * FROM qna WHERE is_published = 1 ORDER BY display_order ASC, created_at DESC`
    ).all();

    // 중복 제거 (동일한 질문 내용 기준)
    const uniqueResults: any[] = [];
    const seenQuestions = new Set<string>();

    for (const item of results || []) {
      if (!seenQuestions.has(item.question)) {
        seenQuestions.add(item.question);
        uniqueResults.push(item);
      }
    }

    return Response.json({ success: true, data: uniqueResults });
  } catch (e) {
    console.error('GET /api/qna', e);
    return Response.json({ error: 'Failed to fetch Q&A' }, { status: 500 });
  }
}
