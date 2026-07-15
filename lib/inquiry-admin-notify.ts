import { sendEmail, escapeHtml } from '@/lib/mail-utils';
import {
    buildInquiryReplyAddress,
    ensureInquiryReplyToken,
} from '@/lib/inquiry-reply-address';
import {
    inquiryFileDisplayName,
    inquiryFilePublicUrl,
    parseInquiryFileUrls,
} from '@/lib/inquiry-files';

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
    replyToken?: string | null;
};

type D1Like = Parameters<typeof ensureInquiryReplyToken>[0];

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
 * Reply-To: 시스템 답장 주소 → 네이버에서 답장 시 문의관리 자동 반영·고객 발송
 */
export async function notifyAdminNewInquiry(
    payload: InquiryNotifyPayload,
    env: Record<string, unknown>,
    db?: D1Like
): Promise<boolean> {
    const adminEmail = getAdminInquiryEmail(env);
    const categoryLabel = getCategoryLabel(payload.category, payload.categoryLabel);
    const sourceLabel = payload.source === 'expert' ? '전문가 문의' : '고객 문의';
    const subjectLine =
        payload.subject?.trim() ||
        `[${sourceLabel}] ${payload.company ? `(${payload.company}) ` : ''}${payload.name}`;

    let replyToken = payload.replyToken || null;
    if (!replyToken && db) {
        replyToken = await ensureInquiryReplyToken(db, payload.inquiryId);
    }
    const fileKeys = parseInquiryFileUrls(payload.fileUrl);
    const fileLinks = fileKeys.map((key) => ({
        name: inquiryFileDisplayName(key),
        url: inquiryFilePublicUrl(key, replyToken),
    }));
    const replyToAddress = replyToken
        ? buildInquiryReplyAddress(payload.inquiryId, replyToken, env)
        : payload.email;

    const replyGuide = replyToken
        ? [
            '',
            '--- 이메일로 답변하기 ---',
            `이 메일에 「답장」하시면 답변 내용이 고객(${payload.email})에게 자동 발송되고,`,
            '문의 관리 화면 상태가 「답변완료」로 변경됩니다.',
            `(시스템 답장 주소: ${replyToAddress})`,
            '※ 반드시 이 메일의 답장 기능을 사용해 주세요. 고객에게 직접 새 메일을 작성하면 자동 연동되지 않습니다.',
        ].join('\n')
        : '';

    const textBody = [
        `[신규 문의 #${payload.inquiryId}]`,
        `이름: ${payload.name}`,
        `이메일: ${payload.email}`,
        payload.company ? `업체명: ${payload.company}` : null,
        payload.phone ? `연락처: ${payload.phone}` : null,
        `문의 유형: ${categoryLabel}`,
        payload.subject ? `제목: ${payload.subject}` : null,
        fileLinks.length
            ? `첨부파일(${fileLinks.length}):\n${fileLinks.map((f, i) => `  ${i + 1}. ${f.name}\n     ${f.url}`).join('\n')}`
            : null,
        '',
        '--- 문의 내용 ---',
        payload.message,
        replyGuide,
        '',
        `관리자 확인: ${ADMIN_INQUIRIES_URL}`,
        fileLinks.length ? '※ 첨부 링크는 관리자 알림 메일에서 바로 열 수 있습니다.' : null,
    ]
        .filter((line) => line !== null)
        .join('\n');

    const htmlBody = `
        <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 16px;">
            <span style="display: inline-block; padding: 6px 12px; background: #2dd4bf; color: #fff; font-size: 11px; font-weight: 800; border-radius: 8px;">New Inquiry #${payload.inquiryId}</span>
            <h2 style="margin: 16px 0 8px; font-size: 20px; font-weight: 900; color: #111;">${escapeHtml(sourceLabel)}가 접수되었습니다</h2>
            <p style="margin: 0 0 20px; font-size: 13px; color: #666;">${escapeHtml(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))}</p>
            ${
                replyToken
                    ? `<div style="padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; margin-bottom: 16px; font-size: 13px; color: #065f46; line-height: 1.6;">
                <strong>📩 이메일로 답변하기</strong><br>
                이 메일에 <strong>「답장」</strong>하시면 답변이 고객(<a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a>)에게 자동 발송되고,<br>
                문의 관리 상태가 <strong>답변완료</strong>로 변경됩니다.
            </div>`
                    : ''
            }
            <div style="padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px;"><strong>이름</strong> ${escapeHtml(payload.name)}${payload.company ? ` (${escapeHtml(payload.company)})` : ''}</p>
                <p style="margin: 0 0 8px;"><strong>고객 이메일</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
                ${payload.phone ? `<p style="margin: 0 0 8px;"><strong>연락처</strong> ${escapeHtml(payload.phone)}</p>` : ''}
                <p style="margin: 0 0 8px;"><strong>유형</strong> ${escapeHtml(categoryLabel)}</p>
                ${payload.subject ? `<p style="margin: 0;"><strong>제목</strong> ${escapeHtml(payload.subject)}</p>` : ''}
            </div>
            ${
                fileLinks.length
                    ? `<div style="margin: 0 0 16px; padding: 14px 16px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #0f766e;">첨부 파일 ${fileLinks.length}개</p>
                <ul style="margin: 0; padding-left: 18px;">
                  ${fileLinks
                      .map(
                          (f) =>
                              `<li style="margin: 0 0 6px;"><a href="${escapeHtml(f.url)}" style="color:#0d9488; font-weight:700;">${escapeHtml(f.name)}</a></li>`
                      )
                      .join('')}
                </ul>
                <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;">파일명을 클릭하면 바로 열거나 다운로드할 수 있습니다.</p>
            </div>`
                    : ''
            }
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
            reply_to: replyToAddress,
        },
        env
    );
}
