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

/**
 * Resend API를 통해 이메일을 전송합니다.
 * @param options 전송 옵션
 * @param env Cloudflare Env 객체 (API Key 포함)
 */
export async function sendEmail(options: SendEmailOptions, env: any): Promise<boolean> {
    try {
        const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        const fromDefault = env.RESEND_FROM || process.env.RESEND_FROM || 'WOW3D <onboarding@resend.dev>';
        
        if (!apiKey) {
            console.error('RESEND_API_KEY가 설정되지 않았습니다.');
            return false;
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
            const error = await response.json().catch(() => ({}));
            console.error('Resend API 오류:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Email 전송 실패:', error);
        return false;
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
