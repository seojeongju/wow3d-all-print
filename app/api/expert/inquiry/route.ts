import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { sendEmail, escapeHtml } from '@/lib/mail-utils';

const CONTACT_TO_EMAIL = 'wow3d16@naver.com';



const MESSAGE_MIN = 10;
const MESSAGE_MAX = 10000; // 전문가 문의는 더 길 수 있음

/**
 * POST /api/expert/inquiry - 전문가 제품 개발 문의 접수 (파일 첨부 지원)
 * FormData: name, email, phone, company, category, subject, message, file
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) return errorResponse('DB를 사용할 수 없습니다.', 503);
    if (!env?.BUCKET) return errorResponse('파일 스토리지를 사용할 수 없습니다.', 503);

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const phone = (formData.get('phone') as string)?.trim() || null;
    const company = (formData.get('company') as string)?.trim() || null;
    const category = (formData.get('category') as string)?.trim() || 'development';
    const subject = (formData.get('subject') as string)?.trim() || `[제품개발] ${company ? `(${company}) ` : ''}${name}님의 문의`;
    const message = (formData.get('message') as string)?.trim() || '';
    const file = formData.get('file') as File | null;

    // 유효성 검사
    if (!name) return errorResponse('이름을 입력해 주세요.', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse('유효한 이메일을 입력해 주세요.', 400);
    if (!message || message.length < MESSAGE_MIN) return errorResponse(`문의 내용을 ${MESSAGE_MIN}자 이상 입력해 주세요.`, 400);

    // IP기반 Rate Limit (선택적)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 1. DB에 기본 정보 먼저 저장
    const result = await env.DB.prepare(
      `INSERT INTO inquiries (name, email, phone, category, subject, message, ip_address, admin_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(name, email, phone, category, subject, `${company ? `[업체명: ${company}]\n` : ''}${message}`, ip, company ? `업체명: ${company}` : null)
      .run();

    const inquiryId = result.meta?.last_row_id;
    if (!inquiryId) return errorResponse('문의 저장에 실패했습니다.', 500);

    let fileUrl = null;

    // 2. 파일이 있으면 R2에 업로드 후 file_url 업데이트
    if (file && file.size > 0) {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const r2Key = `inquiries/${inquiryId}/${fileName}`;
      const arrayBuffer = await file.arrayBuffer();
      
      await env.BUCKET.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: file.type || 'application/octet-stream' }
      });

      fileUrl = r2Key;
      await env.DB.prepare('UPDATE inquiries SET file_url = ? WHERE id = ?')
        .bind(fileUrl, inquiryId)
        .run();
    }

    // 3. 이메일 알림 발송 (Resend)
    const envVars = env as unknown as Record<string, string | undefined>;
    const resendKey = process.env.RESEND_API_KEY || envVars.RESEND_API_KEY;
    const fromAddr = process.env.RESEND_FROM || envVars.RESEND_FROM || 'WOW3D 전문가문의 <onboarding@resend.dev>';
    
    if (resendKey) {
      try {
        const textBody = [
          `이름: ${name}`,
          `이메일: ${email}`,
          company ? `업체명: ${company}` : null,
          phone ? `연락처: ${phone}` : null,
          `문의 유형: 전문가 제품개발`,
          `제목: ${subject}`,
          fileUrl ? `첨부파일: https://wow3dp.co.kr/api/files/${fileUrl} (또는 관리자 패널 확인)` : '첨부파일 없음',
          '',
          '--- 문의 내용 ---',
          message,
        ].filter(Boolean).join('\n');

        const htmlBody = `
          <div style="font-family:sans-serif; line-height:1.6; color:#333;">
            <h2 style="color:#2dd4bf;">Expert Product Development Inquiry</h2>
            <p><strong>발신자:</strong> ${escapeHtml(name)} ${company ? `(${escapeHtml(company)})` : ''}</p>
            <p><strong>이메일:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>연락처:</strong> ${phone ? escapeHtml(phone) : '-'}</p>
            <p><strong>제목:</strong> ${escapeHtml(subject)}</p>
            ${fileUrl ? `<p><strong>첨부파일:</strong> <a href="https://wow3dp.co.kr/api/files/${fileUrl}" style="color:#2dd4bf;">파일 다운로드</a></p>` : ''}
            <hr/>
            <p><strong>문의 내용:</strong></p>
            <pre style="white-space:pre-wrap; background:#f8fafc; padding:15px; border-radius:8px;">${escapeHtml(message)}</pre>
          </div>
        `;

        await sendEmail({
          from: fromAddr,
          to: CONTACT_TO_EMAIL,
          reply_to: email,
          subject: `[전문가문의] ${company ? `(${company}) ` : ''}${name}님의 문의`,
          text: textBody,
          html: htmlBody,
        }, env);
      } catch (emailErr) {
        console.warn('이메일 발송 실패 (문의는 저장됨):', emailErr);
      }
    }

    return successResponse({ id: Number(inquiryId), fileUrl }, '문의가 성공적으로 접수되었습니다. 전문가가 검토 후 연락드리겠습니다.');
  } catch (e: any) {
    console.error('POST /api/expert/inquiry error:', e);
    return errorResponse(e?.message || '처리 중 오류가 발생했습니다.', 500);
  }
}
