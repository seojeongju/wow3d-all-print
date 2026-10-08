/**
 * Email 전송 유틸리티 (Resend API 사용)
 * Cloudflare Worker / V8 Isolate 환경을 지원하기 위해 fetch를 사용하여 구현되었습니다.
 */

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    from?: string;
    reply_to?: string;
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Resend API를 통해 이메일을 전송합니다.
 * @param options 전송 옵션
 * @param env Cloudflare Env 객체 (API Key 포함)
 */
export async function sendEmail(options: SendEmailOptions, env: any): Promise<boolean> {
    return (await sendEmailWithResult(options, env)).ok;
}

/** 발송 실패 사유까지 돌려주는 버전 (발송 기록·재발송 화면용) */
export async function sendEmailWithResult(
    options: SendEmailOptions,
    env: Record<string, unknown>
): Promise<SendEmailResult> {
    try {
        const apiKey = (env.RESEND_API_KEY as string | undefined) || process.env.RESEND_API_KEY;
        const fromDefault =
            (env.RESEND_FROM as string | undefined) || process.env.RESEND_FROM || 'WOW3D <onboarding@resend.dev>';
        
        if (!apiKey) {
            console.error('RESEND_API_KEY가 설정되지 않았습니다.');
            return { ok: false, error: '메일 발송 키(RESEND_API_KEY)가 설정되지 않았습니다.' };
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: options.from || fromDefault,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                text: options.text,
                html: options.html,
                reply_to: options.reply_to,
            }),
        });

        if (!response.ok) {
            const error = (await response.json().catch(() => ({}))) as { message?: string; name?: string };
            console.error('Resend API 오류:', error);
            const detail = error?.message || error?.name || '';
            return { ok: false, error: `메일 서버 오류 (${response.status})${detail ? `: ${detail}` : ''}` };
        }

        return { ok: true };
    } catch (error) {
        console.error('Email 전송 실패:', error);
        return { ok: false, error: error instanceof Error ? error.message : '메일 전송 중 알 수 없는 오류' };
    }
}

/**
 * HTML 이메일을 안전하게 생성하기 위해 간단한 escape 처리를 합니다.
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
