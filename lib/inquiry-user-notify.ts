import { sendEmail, escapeHtml } from '@/lib/mail-utils';
import { getAdminInquiryEmail } from '@/lib/inquiry-admin-notify';

export type UserReplyNotifyPayload = {
    inquiryId: number;
    name: string;
    email: string;
    subject?: string | null;
    message: string;
    replyMessage: string;
};

/**
 * 관리자가 문의에 답변을 작성했을 때 문의한 사용자에게 알림 메일 발송
 * From: noreply@… (Resend 발신 도메인)
 * Reply-To: 관리자 네이버 메일 → 고객이 「답장」하면 wow3d16@naver.com으로 수신
 */
export async function notifyUserInquiryReplied(
    payload: UserReplyNotifyPayload,
    env: any
): Promise<boolean> {
    const subjectLine = `[WOW3D] 문의하신 내용에 대한 답변이 등록되었습니다.`;
    const adminReplyTo = getAdminInquiryEmail(env as Record<string, unknown>);

    // 개행 문자를 HTML <br> 태그로 변환하고 escape 처리
    const formattedOriginalMessage = escapeHtml(payload.message).replace(/\n/g, '<br>');
    const formattedReplyMessage = escapeHtml(payload.replyMessage).replace(/\n/g, '<br>');
    const originalSubject = payload.subject?.trim() || '일반 문의';

    const textBody = [
        `안녕하세요, ${payload.name}님.`,
        'WOW3D를 이용해 주셔서 진심으로 감사드립니다.',
        '보내주신 문의 사항에 대해 관리자 답변이 등록되어 안내해 드립니다.',
        '',
        '--- 문의 내용 ---',
        `제목: ${originalSubject}`,
        payload.message,
        '',
        '--- 답변 내용 ---',
        payload.replyMessage,
        '',
        '추가 문의가 있으시면 이 메일에 「답장」해 주시면 됩니다.',
        '상세한 내용은 WOW3D 홈페이지에서도 확인하실 수 있습니다.',
        'https://wow3dp.co.kr',
    ].join('\n');

    const htmlBody = `
        <div style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
            <div style="margin-bottom: 24px;">
                <span style="display: inline-block; padding: 6px 12px; background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 800; border-radius: 8px; border: 1px solid #bbf7d0;">답변 완료</span>
            </div>
            
            <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; line-height: 1.3;">
                안녕하세요, ${escapeHtml(payload.name)}님.
            </h2>
            <p style="margin: 0 0 32px; font-size: 14px; color: #475569; line-height: 1.6;">
                WOW3D를 이용해 주셔서 진심으로 감사드립니다.<br>
                접수해 주신 문의에 대해 답변이 완료되어 안내해 드립니다.
            </p>

            <!-- 답변 영역 -->
            <div style="margin-bottom: 32px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; position: relative;">
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 6px; height: 6px; background: #10b981; border-radius: 50%; margin-right: 8px;"></span>
                    답변 내용
                </div>
                <div style="font-size: 14px; color: #1e293b; line-height: 1.7; word-break: break-all;">
                    ${formattedReplyMessage}
                </div>
            </div>

            <!-- 이전 문의 내용 -->
            <div style="margin-bottom: 32px; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                    접수된 문의 내용
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                    제목: ${escapeHtml(originalSubject)}
                </div>
                <div style="font-size: 13px; color: #64748b; line-height: 1.6; word-break: break-all; max-height: 200px; overflow-y: auto;">
                    ${formattedOriginalMessage}
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 32px;">
                <a href="https://wow3dp.co.kr" style="display: inline-block; padding: 14px 32px; background: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; transition: background-color 0.2s;">
                    WOW3D 홈페이지 바로가기
                </a>
            </div>

            <div style="margin-top: 40px; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                    추가 문의가 있으시면 이 메일에 「답장」해 주시면 됩니다.
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0;">
                    © WOW3D. All rights reserved.
                </p>
            </div>
        </div>
    `;

    return sendEmail(
        {
            to: payload.email,
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
            reply_to: adminReplyTo,
        },
        env
    );
}
