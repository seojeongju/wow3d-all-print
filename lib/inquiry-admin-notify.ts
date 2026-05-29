import { sendEmail, escapeHtml } from '@/lib/mail-utils';

const DEFAULT_ADMIN_EMAIL = 'wow3d16@naver.com';
const ADMIN_INQUIRIES_URL = 'https://wow3dp.co.kr/admin/inquiries?status=new';

export type InquiryNotifyPayload = {
    inquiryId: number;
    name: string;
    email: string;
    phone?: string | null;
    category?: string | null;
    categoryLabel?: string;
    subject?: string | null;
    message: string;
    fileUrl?: string | null;
    company?: string | null;
    source?: 'contact' | 'expert';
};

const CATEGORY_LABELS: Record<string, string> = {
    general: '일반 문의',
    quote: '견적·제작',
    tech: '기술·파일',
    partnership: '파트너십',
    other: '기타',
    development: '전문가 제품개발',
};

export function getCategoryLabel(category: string | null | undefined, override?: string): string {
    if (override) return override;
    if (!category) return '-';
    return CATEGORY_LABELS[category] || category;
}

export function getAdminInquiryEmail(env: Record<string, unknown>): string {
    const fromEnv =
        (env.ADMIN_EMAIL as string | undefined) ||
        process.env.ADMIN_EMAIL ||
        DEFAULT_ADMIN_EMAIL;
    return fromEnv.trim() || DEFAULT_ADMIN_EMAIL;
}

/**
 * 신규 문의 접수 시 관리자에게 알림 메일 발송
 */
export async function notifyAdminNewInquiry(
    payload: InquiryNotifyPayload,
    env: Record<string, unknown>
): Promise<boolean> {
    const adminEmail = getAdminInquiryEmail(env);
    const categoryLabel = getCategoryLabel(payload.category, payload.categoryLabel);
    const sourceLabel = payload.source === 'expert' ? '전문가 문의' : '고객 문의';
    const subjectLine =
        payload.subject?.trim() ||
        `[${sourceLabel}] ${payload.company ? `(${payload.company}) ` : ''}${payload.name}`;

    const fileLink = payload.fileUrl
        ? `https://wow3dp.co.kr/api/files/${payload.fileUrl}`
        : null;

    const textBody = [
        `[신규 문의 #${payload.inquiryId}]`,
        `이름: ${payload.name}`,
        `이메일: ${payload.email}`,
        payload.company ? `업체명: ${payload.company}` : null,
        payload.phone ? `연락처: ${payload.phone}` : null,
        `문의 유형: ${categoryLabel}`,
        payload.subject ? `제목: ${payload.subject}` : null,
        fileLink ? `첨부파일: ${fileLink}` : null,
        '',
        '--- 문의 내용 ---',
        payload.message,
        '',
        `관리자 확인: ${ADMIN_INQUIRIES_URL}`,
    ]
        .filter(Boolean)
        .join('\n');

    const htmlBody = `
        <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 16px;">
            <span style="display: inline-block; padding: 6px 12px; background: #2dd4bf; color: #fff; font-size: 11px; font-weight: 800; border-radius: 8px;">New Inquiry #${payload.inquiryId}</span>
            <h2 style="margin: 16px 0 8px; font-size: 20px; font-weight: 900; color: #111;">${escapeHtml(sourceLabel)}가 접수되었습니다</h2>
            <p style="margin: 0 0 20px; font-size: 13px; color: #666;">${escapeHtml(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))}</p>
            <div style="padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px;"><strong>이름</strong> ${escapeHtml(payload.name)}${payload.company ? ` (${escapeHtml(payload.company)})` : ''}</p>
                <p style="margin: 0 0 8px;"><strong>이메일</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
                ${payload.phone ? `<p style="margin: 0 0 8px;"><strong>연락처</strong> ${escapeHtml(payload.phone)}</p>` : ''}
                <p style="margin: 0 0 8px;"><strong>유형</strong> ${escapeHtml(categoryLabel)}</p>
                ${payload.subject ? `<p style="margin: 0;"><strong>제목</strong> ${escapeHtml(payload.subject)}</p>` : ''}
            </div>
            ${fileLink ? `<p style="margin: 0 0 16px;"><strong>첨부</strong> <a href="${escapeHtml(fileLink)}" style="color:#0d9488;">파일 보기</a></p>` : ''}
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #334155;">문의 내용</p>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; padding: 16px; background: #f1f5f9; border-radius: 12px; font-size: 13px; color: #111;">${escapeHtml(payload.message)}</pre>
            <div style="margin-top: 24px; text-align: center;">
                <a href="${ADMIN_INQUIRIES_URL}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 10px;">문의 관리에서 확인</a>
            </div>
        </div>
    `;

    return sendEmail(
        {
            to: adminEmail,
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
            reply_to: payload.email,
        },
        env
    );
}
