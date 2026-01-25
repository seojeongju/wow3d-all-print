import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse } from '@/lib/api-utils';

const RATE_LIMIT_PER_HOUR = 5;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

const CATEGORIES = ['general', 'quote', 'tech', 'partnership', 'other'] as const;

function getClientIp(request: Request): string | null {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

/**
 * POST /api/inquiries - 문의 접수 (인증 불필요)
 * Body: { name, email, phone?, category?, subject?, message }
 * 로그인 사용자는 Authorization 헤더로 user_id 보강 가능
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return errorResponse('일시적으로 접수를 받을 수 없습니다.', 503);
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    const category =
      typeof body.category === 'string' && CATEGORIES.includes(body.category as any)
        ? body.category
        : null;
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length < 1) {
      return errorResponse('이름을 입력해 주세요.', 400);
    }
    if (!email) {
      return errorResponse('이메일을 입력해 주세요.', 400);
    }
    const emailSimple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailSimple.test(email)) {
      return errorResponse('올바른 이메일 주소를 입력해 주세요.', 400);
    }
    if (!message) {
      return errorResponse('문의 내용을 입력해 주세요.', 400);
    }
    if (message.length < MESSAGE_MIN) {
      return errorResponse(`문의 내용은 ${MESSAGE_MIN}자 이상 입력해 주세요.`, 400);
    }
    if (message.length > MESSAGE_MAX) {
      return errorResponse(`문의 내용은 ${MESSAGE_MAX}자 이하여야 합니다.`, 400);
    }

    const ip = getClientIp(request);
    if (ip) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const r = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM inquiries WHERE ip_address = ? AND created_at > ?`
      )
        .bind(ip, hourAgo)
        .first<{ cnt: number }>();
      if ((r?.cnt ?? 0) >= RATE_LIMIT_PER_HOUR) {
        return errorResponse('잠시 후 다시 시도해 주세요. (1시간에 5건까지)', 429);
      }
    }

    let userId: number | null = null;
    try {
      const { requireAuth } = await import('@/lib/api-utils');
      const auth = await requireAuth(request);
      if (!(auth instanceof Response)) {
        userId = auth.userId;
      }
    } catch {
      // 비회원: userId = null
    }

    const result = await env.DB.prepare(
      `INSERT INTO inquiries (user_id, name, email, phone, category, subject, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(userId, name, email, phone || null, category, subject, message, ip)
      .run();

    const id = result.meta?.last_row_id;
    if (!id) {
      return errorResponse('문의 접수에 실패했습니다.', 500);
    }

    return successResponse({ id: Number(id) }, '문의가 접수되었습니다.');
  } catch (e: any) {
    console.error('POST /api/inquiries error:', e);
    return errorResponse(e?.message || '문의 접수에 실패했습니다.', 500);
  }
}
