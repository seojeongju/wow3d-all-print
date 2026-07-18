/**
 * 네이버 톡톡 실시간 상담 링크 (클라이언트·서버 공통)
 *
 * NEXT_PUBLIC_NAVER_TALKTALK_ID: 파트너센터 채팅창 코드 (예: WCWl7TU → talk.naver.com/WCWl7TU)
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

    // 이미 전체 URL이면 그대로
    if (/^https?:\/\//i.test(id)) return id;

    // 경로 형태(wc/xxx, profile/xxx) 또는 채팅창 코드(WCWl7TU)
    return `https://talk.naver.com/${id.replace(/^talk\.naver\.com\//i, '')}`;
}

export function getNaverTalkTalkBannerId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID) return null;
    const raw = process.env.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID.trim();
    return raw || null;
}
