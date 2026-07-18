/**
 * 네이버 톡톡 실시간 상담 링크 (클라이언트·서버 공통)
 *
 * NEXT_PUBLIC_NAVER_TALKTALK_ID: 톡톡 파트너센터 계정코드 (예: w4xxxxxx)
 * NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL: 전체 채팅 URL (있으면 ID보다 우선)
 * NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID: 파트너센터 배너 data-id (공식 배너 위젯용, 선택)
 */

export function getNaverTalkTalkId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_NAVER_TALKTALK_ID) return null;
    const raw = process.env.NEXT_PUBLIC_NAVER_TALKTALK_ID.trim();
    if (!raw) return null;
    return raw.replace(/^\/+/, '');
}

export function getNaverTalkTalkChatUrl(): string | null {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL) {
        const custom = process.env.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL.trim();
        if (custom) return custom;
    }

    const id = getNaverTalkTalkId();
    if (!id) return null;

    // 이미 경로 형태(wc/xxx, ct/xxx)면 그대로 사용
    if (id.includes('/')) {
        return `https://talk.naver.com/${id}`;
    }

    // 파트너센터 계정코드 → 웹 상담 URL
    return `https://talk.naver.com/wc/${id}`;
}

export function getNaverTalkTalkBannerId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID) return null;
    const raw = process.env.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID.trim();
    return raw || null;
}
