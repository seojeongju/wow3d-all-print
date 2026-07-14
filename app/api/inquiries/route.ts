import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { notifyAdminNewInquiry } from '@/lib/inquiry-admin-notify';
import { generateInquiryReplyToken } from '@/lib/inquiry-reply-address';

const RATE_LIMIT_PER_HOUR = 5;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXT = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'pdf', 'zip',
  'stl', 'obj', '3mf', 'step', 'stp',
]);

const CATEGORIES = ['general', 'quote', 'tech', 'partnership', 'other'] as const;

function getClientIp(request: Request): string | null {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function validateAttachment(file: File | null): string | null {
  if (!file || file.size <= 0) return null;
  if (file.size > MAX_FILE_BYTES) return '첨부 파일은 50MB 이하여야 합니다.';
  const ext = getExt(file.name || '');
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return '허용되지 않는 파일 형식입니다. (이미지·PDF·ZIP·STL·OBJ·3MF·STEP)';
  }
  return null;
}

/**
 * POST /api/inquiries - 문의 접수 (인증 불필요, 파일 첨부 선택)
 * FormData 또는 JSON: name, email, phone, category?, subject?, message, file?
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return errorResponse('일시적으로 접수를 받을 수 없습니다.', 503);
    }

    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let phone = '';
    let category: string | null = null;
    let subject: string | null = null;
    let message = '';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = String(formData.get('name') || '').trim();
      email = String(formData.get('email') || '').trim();
      phone = String(formData.get('phone') || '').trim();
      const cat = String(formData.get('category') || '').trim();
      category = cat && CATEGORIES.includes(cat as (typeof CATEGORIES)[number]) ? cat : null;
      const sub = String(formData.get('subject') || '').trim();
      subject = sub ? sub.slice(0, 200) : null;
      message = String(formData.get('message') || '').trim();
      const rawFile = formData.get('file');
      file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
    } else {
      const body = await request.json().catch(() => ({}));
      name = typeof body.name === 'string' ? body.name.trim() : '';
      email = typeof body.email === 'string' ? body.email.trim() : '';
      phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      category =
        typeof body.category === 'string' && CATEGORIES.includes(body.category as any)
          ? body.category
          : null;
      subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : null;
      message = typeof body.message === 'string' ? body.message.trim() : '';
    }

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
    if (!phone) {
      return errorResponse('연락처를 입력해 주세요.', 400);
    }
    if (phone.replace(/\D/g, '').length < 9) {
      return errorResponse('올바른 연락처를 입력해 주세요.', 400);
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

    const fileError = validateAttachment(file);
    if (fileError) return errorResponse(fileError, 400);
    if (file && !env?.BUCKET) {
      return errorResponse('파일 첨부를 일시적으로 사용할 수 없습니다. 파일 없이 문의해 주세요.', 503);
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

    const replyToken = generateInquiryReplyToken();

    let result;
    try {
      result = await env.DB.prepare(
        `INSERT INTO inquiries (user_id, name, email, phone, category, subject, message, ip_address, reply_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(userId, name, email, phone, category, subject, message, ip, replyToken)
        .run();
    } catch {
      result = await env.DB.prepare(
        `INSERT INTO inquiries (user_id, name, email, phone, category, subject, message, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(userId, name, email, phone, category, subject, message, ip)
        .run();
    }

    const id = result.meta?.last_row_id;
    if (!id) {
      return errorResponse('문의 접수에 실패했습니다.', 500);
    }

    let fileUrl: string | null = null;
    if (file && env.BUCKET) {
      const safeName = (file.name || 'attachment').replace(/[^\w.\uac00-\ud7a3-]+/g, '_').slice(0, 120);
      const fileName = `${Date.now()}_${safeName}`;
      const r2Key = `inquiries/${id}/${fileName}`;
      const arrayBuffer = await file.arrayBuffer();
      await env.BUCKET.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });
      fileUrl = r2Key;
      await env.DB.prepare('UPDATE inquiries SET file_url = ? WHERE id = ?')
        .bind(fileUrl, id)
        .run();
    }

    let emailSent = false;
    try {
      emailSent = await notifyAdminNewInquiry(
        {
          inquiryId: Number(id),
          name,
          email,
          phone,
          category,
          subject,
          message,
          fileUrl,
          source: 'contact',
          replyToken,
        },
        env as unknown as Record<string, unknown>,
        env.DB
      );
      if (!emailSent) {
        console.warn('문의 관리자 알림 메일 미발송 (RESEND_API_KEY 확인 필요, 문의는 DB 저장됨)');
      }
    } catch (emailErr) {
      console.warn('문의 관리자 알림 메일 발송 실패 (문의는 DB 저장됨):', emailErr);
    }

    return successResponse({ id: Number(id), fileUrl, emailSent }, '문의가 접수되었습니다.');
  } catch (e: any) {
    console.error('POST /api/inquiries error:', e);
    return errorResponse(e?.message || '문의 접수에 실패했습니다.', 500);
  }
}
