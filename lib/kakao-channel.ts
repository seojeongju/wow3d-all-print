/**
 * 카카오 비즈니스 채널 링크 (클라이언트·서버 공통)
 * NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID: pf.kakao.com 주소의 검색용 아이디 (예: _xAbCdE)
 */
export function getKakaoChannelSearchId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID) return null;
    const raw = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_SEARCH_ID.trim();
    if (!raw) return null;
    return raw.startsWith('_') ? raw : `_${raw}`;
}

export function getKakaoChannelChatUrl(): string | null {
    const id = getKakaoChannelSearchId();
    if (!id) return null;
    return `https://pf.kakao.com/${id}/chat`;
}

export function getKakaoChannelAddFriendUrl(): string | null {
    const id = getKakaoChannelSearchId();
    if (!id) return null;
    return `https://pf.kakao.com/${id}/friend`;
}
